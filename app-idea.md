# App Idea: onBLAST — Community-Driven Business Accountability Platform

## Working Concept
A platform where people can openly complain about businesses, share hard truths, and post honest experiences without heavy-handed moderator censorship. Businesses can respond publicly. The community, not moderators, decides who is credible and who gets banned.

## Core Problem
Most platforms remove posts, silence criticism, or ban users even when they are just speaking plainly about real experiences. Moderators often act on opinion, and businesses can pressure platforms into burying negative feedback. onBLAST protects open discussion and keeps moderation power from overriding the community.

## Core Promise
- Users can speak freely about businesses.
- Traditional mods do not control what opinions are allowed.
- The platform is built to protect user anonymity.
- The community, not moderators, decides who earns trust or loses it.
- Businesses get a real voice, but not a veto.

## Non-Goals
To stay focused, onBLAST is explicitly **not**:
- A general-purpose social network. It is about businesses and consumer experience.
- A listings or ratings aggregator (no star averages driving SEO games).
- A tool for mod-driven "community guidelines" enforcement.
- A platform that sells reputation management to the businesses it covers.

## Main Principles

### 1. Free Expression First
Users should be able to post complaints, rants, warnings, reviews, and blunt opinions about businesses without fear that a mod will remove the post just for being negative or uncomfortable.

### 2. Anonymous by Design
The app should fight to keep users anonymous so people can speak honestly without fear of retaliation from companies, employers, or online mobs.

### 3. Reputation Is Community-Based
Every user builds a public reputation over time based on how the broader community reacts to their posts, comments, and rants.

Reputation signals:
- Upvotes and downvotes
- Agreement or disagreement ratios
- Community trust score
- History of accurate or useful posts
- Credibility score adjustments from automated cross-referencing (see below)

Judgment comes from peers, not moderators.

### 4. Mods Do Not Rule Speech
Moderators cannot remove content because they dislike it, disagree with it, or think it is too harsh. Their role is minimal and operational — handling spam, broken features, and hard-limit content (see *Hard Limits*) — never opinion-based.

## Hard Limits on Content
Free expression is the default, but a few categories must be removed on sight because hosting them would be illegal or would destroy the platform. These are the only categories mods may act on unilaterally, and every action is logged publicly:

- **Child sexual abuse material (CSAM).** Required by US federal law (18 U.S.C. § 2258A) to be reported to NCMEC the moment the platform becomes aware of it. Reactive — triggered by user flags or mod review, not by proactive scanning of user content. No community vote applies here; reporting is mandatory and overrides every other policy in this document.
- Doxxing and non-consensual release of private personal information.
- Credible, specific threats of violence.
- Content a court has ordered removed in a jurisdiction the platform operates in.

Everything else — harsh criticism, accusations, insults, unpopular opinions, unverified claims — stays up and is handled through credibility scoring and community voting.

## Credibility and False Claims
The platform runs background checks on factual claims by cross-referencing the open internet, news APIs, and other public data sources. When a post is contradicted by verifiable information, the system lowers the author's credibility score rather than removing the post.

- Users are informed when their credibility changes and why, with links to the sources used.
- The system never bans users for false claims — that power stays with the community.
- Credibility signals are visible on every post so readers can judge in context.
- Credibility can recover over time as a user posts accurate content.

## Ban Policy
Users cannot be banned by a moderator acting alone. Bans are community-driven:

1. **Petition open.** Any user with standing can open a ban petition against another user.
2. **Petition threshold.** A petition only advances to a vote once it collects a minimum number of co-signers (exact number TBD — sized so trivial grudges do not trigger votes, but real community concern can).
3. **Voter eligibility.** Only users above a minimum reputation/account-age threshold can vote, to reduce throwaway-account manipulation.
4. **Quorum and supermajority.** At least 77% of participating voters must agree, above a minimum quorum.
5. **Cooldown.** If a petition fails, the same user cannot be re-petitioned for a cooldown period to prevent harassment via repeated petitions.
6. **Appeal.** A banned user can appeal once; the appeal is visible to the community and uses the same voting process in reverse.

What counts as a ban-worthy offense is not defined by rule — it is defined by community judgment. If the community feels a user is abusive or is spreading seriously damaging false claims, they can petition. The 77% bar keeps bans rare.

### Community-Voted Surveillance Unlock
A separate 77% community vote can unlock *prospective* extra data collection on a specific user — IP, device identifiers, session metadata — going forward only. This is how the platform can still act when the community concludes someone is doing real harm, without holding a permanent pool of deanonymizing data on everyone.

Key rules:
- **Prospective only.** The platform cannot conjure data it never held. A vote unlocks future collection, not retroactive disclosure.
- **User is notified.** The user is told their account is now under collection, which itself is a signal.
- **Time-boxed.** The collection window expires unless re-voted.
- **Does not override hard limits.** CSAM reporting happens regardless; this mechanism does not apply there.

## Business Participation
Businesses are explicitly welcome and may respond publicly.

- The app raises awareness about both good and bad businesses.
- Verified business accounts can post replies, clarifications, and corrections on threads about them.
- Businesses are subject to the same reputation and credibility systems as any other account.
- Businesses cannot remove, hide, or suppress posts about them. They can only respond.
- Business verification is required (to prevent impersonation) but does not grant extra privileges.

## Anonymity Protection
Protecting user anonymity is a core promise and top technical priority. The goal: a user's real-world identity cannot be recovered from their posts, account, or platform activity — even under pressure from companies, employers, or legal requests where legitimately resistable.

### Architectural model (decided)
Default posture is "nothing to subpoena" — the platform is built so it literally does not hold the data that would deanonymize users. A subpoena for data the platform does not have returns nothing. This is the Signal model applied to a content platform.

- No email or phone required to sign up.
- No IP address logging by default.
- No device fingerprinting.
- Client-side encryption where it does not break core features.
- Minimal session metadata, retained for the shortest practical window.

Escalation from the default is gated by the **Community-Voted Surveillance Unlock** (see Ban Policy) — prospective collection only, never retroactive disclosure.

### Identity model (decided)
- **MVP:** Pure pseudonymous signup. Each account is a locally-generated keypair. No email, phone, payment, invite, or third-party attestation required.
- **V2:** Add an **optional** proof-of-personhood attestation (see Sybil Resistance) that increases voting weight. Never required — pure-pseudonymous accounts remain first-class.

### Still to decide
- Pseudonymous reputation that survives account rotation without letting one person run many accounts.
- Hosting provider choice and exact data-residency posture within the US.

## Sybil Resistance
Anonymous voting is meaningless if one person can create thousands of accounts. onBLAST addresses this without compromising anonymity at signup by making voting power earned rather than granted, and by leaving the door open to optional human-verification later.

### MVP approach (decided)
Sybil resistance lives in the **voting system**, not the signup flow. Anyone can create an account, but:

- A brand-new account has near-zero weight on ban petitions.
- New accounts have only minor weight on upvotes and downvotes.
- Voting weight accrues over weeks of genuine activity — account age, posts, engagement that the broader community reacts to.
- A Sybil attacker would need to run many accounts for months with credible activity to gain meaningful voting power. This is expensive at scale and detectable in patterns.

Implication: in the first few weeks after launch, the petition/ban system is effectively non-functional because nobody has enough earned weight to vote. That is a feature, not a bug — small communities do not need formal governance, and norms get time to form organically before votes do.

### V2 approach (planned)
Add an **optional** "verified unique human" attestation that increases an account's voting weight. Never required. Users who want pure anonymity keep it; users who want a louder voice can opt in. Tech candidates include social-graph vouching (BrightID, Proof of Humanity) and zero-knowledge credentials backed by government ID where the platform never sees the identity — final choice deferred until v2.

### Still to decide
- Exact voting-weight curve (how steep the ramp is — a v1 tuning decision).
- Detection of coordinated voting patterns without surveilling individuals.
- Whether aged-but-inactive accounts should decay in weight to prevent sleeper-Sybil farms.

## Vote Manipulation and Brigading (Research Area)
Businesses and motivated groups will try to manipulate reputation and petitions. Research needed on:

- Detection of coordinated upvote/downvote campaigns.
- Whether only users who have interacted with a thread can vote on petitions tied to it.
- Public audit logs of voting patterns without exposing individual voters.

## Legal Safeguards

### Decided
- **Jurisdiction: United States.** Operator is Seattle-based; incorporating and hosting domestically is the only posture that preserves the protections below. Going offshore does not shield a US-resident operator and gives up Section 230.
- **Section 230 reliance.** 47 U.S.C. § 230 shields the platform from liability for user-generated content — the single strongest legal protection for a site like onBLAST. Design choices must not accidentally forfeit it (e.g., editorial moderation of opinion-based content would weaken the shield; operational moderation of hard-limit content does not).
- **Washington anti-SLAPP.** The state's anti-SLAPP law gives both the platform and users a defense against frivolous defamation suits designed to silence criticism.
- **Anonymous-speech precedent.** Courts (Dendrite, Doe v. Cahill, and successors) apply a high bar before compelling a platform to unmask an anonymous user. Combined with the "nothing to subpoena" architecture, this is the two-layer defense for user anonymity.
- **CSAM mandatory reporting.** 18 U.S.C. § 2258A; reactive, not proactive scanning (see Hard Limits).

### Notice-and-response workflow (decided)
The process for receiving, evaluating, and responding to legal demands (DMCA takedowns, defamation claims, cease-and-desists, subpoenas, court orders, law enforcement requests). The whole point of onBLAST is that mods cannot remove content based on opinion — so if a single lawyer letter could quietly cause removal, businesses would weaponize fake legal demands as a cheaper silencing tool than vote manipulation. This workflow is designed to prevent that.

- **Single intake channel.** One legal-agent address for all demands. No ad-hoc reporting to individual mods.
- **Designated agent, not a mod.** One named person (operator or outside counsel) receives and evaluates every demand. Mods have no role in legal intake.
- **Push back by default.** Every demand other than a valid court order gets a response asking for specifics and legal basis before any action. Most abusive demands fold under challenge.
- **Public logging.** Every demand received is logged publicly in the moderation log — sender, target, and outcome (modeled on the Lumen Database approach used by Google, Reddit, Twitter). This is the strongest practical deterrent against abuse of the process.
- **User notice.** When a demand targets a specific user, that user is notified (unless legally gagged) so they can respond or counter-notify.
- **Takedown only on valid court order.** Not on lawyer letters, not on contested DMCA claims, not on "we don't like this post."

This workflow is mechanical and non-editorial by design, which actively strengthens the Section 230 shield rather than weakening it.

### Still to decide
- **How credibility scoring interacts with defamation standards.** A low credibility score is not a legal finding; the platform should be careful that automated labels do not themselves become actionable.
- **Operator protections.** Entity structure (see Sustainability Model) plus insurance coverage for platform operators.

## Sustainability Model

### Entity structure (decided)
**Washington Social Purpose Corporation (SPC)** or **Public Benefit LLC**, with the public benefit written into the charter as "protect anonymous user speech about businesses and resist business capture of the platform." The charter is the answer to "why should users believe you won't sell them out when the offer gets big enough" — it legally binds the company to weigh user interests alongside profit.

This preserves the ability to make money (founders can profit, investment is possible) while making the mission structurally load-bearing.

### Funding sources

**Ruled out up front:**
- Ads from covered businesses.
- Paid reputation management.
- Paid post removal or suppression.
- Anything that lets a covered business influence what users see about them.
- Affiliate links to competitors of criticized businesses (creates the appearance that the platform profits from negativity).

**Year-one stack (decided):** three sources, each doing a different job.

1. **Membership tier.** Recurring subscription ($3–5/month range, final number TBD) modeled on Discord Nitro and Reddit Premium. Cosmetic and convenience perks *only* — never extra voting power, never altered feeds, never priority in disputes. Things like profile customization, saved searches, follow many businesses, longer history access. This is the primary revenue engine: recurring, controllable, and directly aligned with users who most believe in the mission.
2. **Paid business verification.** Flat fee per verified business account. Prevents impersonation, grants no reputation effect, no privileges beyond a verified badge.
3. **Donations.** One-time and recurring. Signal / Wikipedia model. The baseline for users who want to support the mission without membership. Transparent reporting on totals.

**Secondary, opportunistic:**
- **Grants** from press-freedom and consumer-advocacy funders (EFF, Knight Foundation, Ford Foundation, Media Democracy Fund). Good for year-one runway cushion; the business is not built around them.
- **Paid API access** for researchers, journalists, and consumer-advocacy groups. Price generously for small-scale research; monetize only true enterprise use. Reddit's 2023 API pricing disaster is the cautionary tale — do not price this to force out community tooling.
- **Merch.** Small but real; community-identity-driven.

**Deferred to v3+ and requires fresh evaluation at that time:**
- Aggregate, non-identifying trend data for journalism and government consumer-protection use. Aggregate only, never user-level.
- White-label licensing of the governance system (77% community vote + credibility scoring) to other domains such as landlord review, employer review, or public-service accountability.

## App Features
- Anonymous posting and commenting
- Business pages and searchable business profiles
- Verified business reply accounts
- Public rant threads
- Community voting on posts and comments
- User reputation scores
- Automated credibility scoring with source links
- Petition-based ban system with quorum, supermajority, cooldowns, and appeals
- Publicly visible moderation logs (every mod action, every petition, every vote aggregate)
- Appeal system visible to the community

## MVP Scope
First release should prove the core loop: anonymous posts, business pages, community voting, reputation, and visible moderation logs. Defer until v2:
- Automated credibility cross-referencing (start with manual flagging).
- Business reply accounts (start read-only).
- Formal appeals workflow (start with simple un-ban petitions).

## Success Signals
- Posts stay up even when they are harsh or unpopular.
- Bans are rare and, when they happen, supported by a clear community vote.
- Businesses engage by responding, not by trying to remove content.
- Credibility scores track with user perception of trustworthiness over time.
- No single moderator action ever silences a legitimate complaint.

## Key Risks
- Sybil attacks undermining the voting system.
- Legal pressure on the operator to deanonymize users.
- Mob dynamics producing unjust bans despite the 77% bar.
- Businesses manipulating reputation through coordinated accounts.
- Being painted as a harassment platform if hard limits are not enforced consistently.

## Value Proposition
For people tired of platforms that suppress criticism, protect businesses from public backlash, or let moderators control what people are allowed to say.

## Simple Pitch
"A place to speak freely about businesses, stay anonymous, and let the community — not moderators — decide reputation and bans."

## Open Questions

### Resolved
- ✅ **Jurisdiction and hosting.** United States, Washington-based entity (SPC or Public Benefit LLC).
- ✅ **Entity structure.** Mission-binding charter (see Sustainability Model).
- ✅ **Architectural privacy posture.** "Nothing to subpoena" default + community-voted prospective surveillance unlock.
- ✅ **CSAM posture.** Mandatory NCMEC reporting, reactive only, no community vote applies.
- ✅ **Anonymity identity model.** MVP: pure pseudonymous keypair signup, no PII. V2: optional proof-of-personhood attestation for extra voting weight.
- ✅ **Sybil resistance approach.** Earned-voting-weight model at MVP; optional PoP attestation at V2.
- ✅ **Notice-and-response workflow.** Single intake channel, designated agent, push-back-by-default, public logging, user notice, takedown only on valid court order.
- ✅ **Year-one funding stack.** Membership tier (primary) + paid business verification + donations; grants and paid API opportunistic.

### Must resolve before building (architectural)
All architectural blockers are resolved.

### Tune after launch (parameters and policy)
Pick reasonable defaults now; adjust with real usage data.

- Concrete numbers: petition open threshold, voter minimum reputation, voter minimum account age, petition cooldown period, ban duration, surveillance-unlock duration.
- Whether petition voting is open to all eligible users or restricted to users who have engaged with the accused user's content.
- Exact credibility-score weights and how fast credibility can recover.
- Quorum size for a petition vote to count.
