// The grown-up PIN and manual awards. The hashing and the lockout are
// the parts worth pinning down: one must never store what was typed,
// the other must actually slow a run of guesses.
import {
  isValidPin, hashPin, pinMatches, randomSalt,
  lockoutAfter, lockoutStatus, MAX_ATTEMPTS, LOCKOUT_MS,
  validateAward,
} from '../src/pin.js'

let pass = 0, fail = 0
const eq = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got  ${JSON.stringify(a)}\n   want ${JSON.stringify(e)}`}`) }

// ── Shape ────────────────────────────────────────────────────────────
eq(isValidPin('1234'), true, 'four digits is a PIN')
eq(isValidPin('123'), false, 'three digits is not')
eq(isValidPin('12345'), false, 'five digits is not')
eq(isValidPin('12a4'), false, 'letters are not')
eq(isValidPin(''), false, 'nothing is not')
eq(isValidPin(undefined), false, 'undefined is not')

// ── Hashing ──────────────────────────────────────────────────────────
const salt = randomSalt()
const hash = await hashPin('1234', salt)
eq(hash.includes('1234'), false, 'the stored hash does not contain the PIN')
eq(hash.length, 64, 'SHA-256 hex')
eq(await pinMatches('1234', { pinSalt: salt, pinHash: hash }), true, 'the right PIN matches')
eq(await pinMatches('1235', { pinSalt: salt, pinHash: hash }), false, 'a wrong PIN does not')
eq(await pinMatches('1234', { pinSalt: randomSalt(), pinHash: hash }), false, 'the same PIN under a different salt does not match')
eq(await pinMatches('1234', {}), false, 'a family with no PIN set never matches')
eq(await pinMatches('', { pinSalt: salt, pinHash: hash }), false, 'an empty guess never matches')
eq(randomSalt() === randomSalt(), false, 'every family gets its own salt')

// ── Lockout ──────────────────────────────────────────────────────────
const now = 1_000_000
let attempts = { failures: 0, lockedUntil: 0 }
for (let i = 1; i < MAX_ATTEMPTS; i++) {
  attempts = lockoutAfter(attempts, now)
  eq(lockoutStatus(attempts, now).locked, false, `wrong guess ${i} of ${MAX_ATTEMPTS} still lets you try`)
}
attempts = lockoutAfter(attempts, now)
eq(lockoutStatus(attempts, now).locked, true, `guess ${MAX_ATTEMPTS} starts the pause`)
eq(lockoutStatus(attempts, now).secondsLeft, LOCKOUT_MS / 1000, 'and it lasts the full minute')
eq(lockoutStatus(attempts, now + LOCKOUT_MS).locked, false, 'the pause ends on its own')
eq(lockoutStatus(attempts, now + LOCKOUT_MS).triesLeft, MAX_ATTEMPTS, 'and the count starts over')
eq(lockoutStatus(undefined, now).locked, false, 'a device that has never guessed is not locked')

// ── Manual award ─────────────────────────────────────────────────────
eq(validateAward({ stars: '20', note: '  幫忙洗碗  ' }), { ok: true, value: { stars: 20, note: '幫忙洗碗' } }, 'takes an amount and trims the note')
eq(validateAward({ stars: '5' }), { ok: true, value: { stars: 5, note: '' } }, 'a note is optional')
eq(validateAward({ stars: '0' }).reason, 'amount-invalid', 'zero stars is not an award')
eq(validateAward({ stars: '-5' }).reason, 'amount-invalid', 'nor is a negative one')
eq(validateAward({ stars: '2.5' }).reason, 'amount-invalid', 'nor half a star')
eq(validateAward({ stars: '' }).reason, 'amount-invalid', 'nor a blank')
eq(validateAward({ stars: '101' }).reason, 'amount-too-big', 'a slip of the keyboard is caught')
eq(validateAward({ stars: '100' }).ok, true, 'but the cap itself is allowed')
eq(validateAward({ stars: '5', note: 'x'.repeat(60) }).value.note.length, 40, 'an overlong note is cut to fit')

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
