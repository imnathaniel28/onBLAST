// Voting weight is earned, not granted. Weight is a function of:
//   - account age (in days since creation)
//   - reputation score (community reactions to this account's posts/comments)
//
// Sybil resistance lives here, not in the signup flow. New accounts have
// near-zero weight on petitions; they gain it slowly over weeks. See
// app-idea.md > Sybil Resistance for the model, and "Still to decide" for
// parameters that are v1 tuning decisions (not implementation decisions).
//
// Two surfaces:
//   - contentVoteWeight: weight on upvotes/downvotes of posts and comments.
//   - petitionVoteWeight: weight on ban petitions. Higher bar, steeper curve.
//
// Both take a snapshot of account state at vote time. The snapshot is
// written to Vote.weight / PetitionVote.weight so later reputation changes
// do not retroactively alter past votes.

export interface AccountWeightInput {
  createdAt: Date;
  reputationScore: number;
  now?: Date;
}

// Placeholder curves. Real curves are a v1 tuning decision — flag as TODO.
// The shape is intentional: both curves start at ~0 and ramp with age, with
// reputation acting as a multiplier after a floor of activity.

function ageDays(createdAt: Date, now: Date): number {
  const ms = now.getTime() - createdAt.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

// Content vote weight: smooth ramp, most active users near a cap of 10.
export function contentVoteWeight(input: AccountWeightInput): number {
  const now = input.now ?? new Date();
  const age = ageDays(input.createdAt, now);
  // TODO(tuning): parameter set for MVP. See "Still to decide".
  const ageTerm = Math.min(5, Math.floor(age / 7)); // 1 per week, cap 5
  const repTerm = Math.min(5, Math.max(0, Math.floor(input.reputationScore / 20)));
  return ageTerm + repTerm;
}

// Petition vote weight: much steeper ramp. Brand-new accounts contribute ~0.
// The spec says "in the first few weeks after launch, the petition/ban system
// is effectively non-functional because nobody has enough earned weight to
// vote. That is a feature, not a bug."
export function petitionVoteWeight(input: AccountWeightInput): number {
  const now = input.now ?? new Date();
  const age = ageDays(input.createdAt, now);
  // TODO(tuning): parameter set for MVP.
  if (age < 30) return 0;
  const ageTerm = Math.min(5, Math.floor((age - 30) / 14)); // 1 per fortnight after 30 days, cap 5
  const repTerm = Math.min(5, Math.max(0, Math.floor(input.reputationScore / 50)));
  return ageTerm + repTerm;
}

// Eligibility gate for opening a petition. Prevents brand-new throwaways
// from opening petitions at scale.
export function canOpenPetition(input: AccountWeightInput): boolean {
  return petitionVoteWeight(input) >= 1;
}
