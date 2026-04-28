export const STARTER_TEMPLATES = [ 
 
   // ── Job Search ────────────────────────────────────────────────────────────── 
   { 
     name: 'Cold Application — Direct', 
     category: 'job_search', 
     subject: '{Excited about|Interested in|Applying for} {a role at|an opportunity at|joining} {{Company}}', 
     body: `{Hi|Hello|Hey} {{FirstName}}, 
 
 {I came across|I recently discovered|I've been following} {{Company}} and {I'm genuinely impressed by|I love what you're building with|I've been excited about} {the work your team is doing|your recent growth|your product}. 
 
 I'm a {{YourRole}} with {{YearsExp}} years of experience in {{Skill1}} and {{Skill2}}. {Most recently|In my last role|Recently,} I {{RecentAchievement}}. 
 
 {I'd love to explore|I'm reaching out about|I'm curious about} any {open roles|opportunities|positions} {on your team|at {{Company}}|in your {{Department}} team}. {I think I could add real value to|I believe my background aligns well with|I'm excited about the possibility of contributing to} what you're building. 
 
 {Would you be open to a quick 15-minute call?|Could we find 15 minutes to connect?|Are you available for a brief chat this week?} 
 
 {Thanks so much|Thank you|Appreciate your time}, 
 {{YourName}}`, 
   }, 
 
   { 
     name: 'Cold Application — Value-First', 
     category: 'job_search', 
     subject: '{{YourRole}} who {can help|wants to help} {{Company}} {grow|scale|win}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {Quick note|One thing I noticed|Something caught my attention} — {{Company}} {recently|just} {{CompanyNews}}. {That's exactly the kind of challenge I love solving.|That's the kind of problem I've been working on.|I've helped teams tackle exactly that.} 
 
 {Background: I'm|I'm} a {{YourRole}} {who's spent|with} {{YearsExp}} years {helping teams|working on} {{Skill1}}. {I previously|At my last company,|Most recently,} I {{RecentAchievement}}, which resulted in {{QuantifiedResult}}. 
 
 {I don't want to take up much of your time — just wanted to put myself on your radar.|No pitch here — just thought there might be a fit worth exploring.|I'll keep this short.} 
 
 {Worth a 15-minute call?|Open to a quick chat?|Would you be up for a brief intro?} 
 
 {{YourName}}`, 
   }, 
 
   // ── Referral Request ──────────────────────────────────────────────────────── 
   { 
     name: 'Referral Request — Warm', 
     category: 'referral_request', 
     subject: '{Quick ask|Small favor|One question} — referral to {{Company}}?', 
     body: `{Hi|Hey} {{FirstName}}, 
 
 {Hope you're doing well!|Hope things are going well on your end!|Hope this finds you well!} 
 
 {I've been following|I've been really interested in} {{Company}} for a while and {I noticed|I saw|I know} you work there. {I'm actively exploring new opportunities and|I'm looking for my next role and|I'd love to join the team — } {{Company}} {is at the top of my list|is somewhere I'd love to land|is genuinely exciting to me}. 
 
 {I'm applying for the|I'm interested in the} {{RoleName}} role and {wanted to ask if you'd be open to|I'd love it if you could} {referring me|putting in a good word|submitting a referral}. {No pressure at all if it's not something you're comfortable with.|Totally understand if that's not something you'd want to do.|Only if you feel comfortable!} 
 
 {I'm happy to share my resume or any other context that would help.|I can send over my resume and portfolio if that's useful.|Happy to share anything else that might be helpful.} 
 
 {Thanks so much — really appreciate you even reading this!|Thank you for considering it!|Really appreciate you!} 
 {{YourName}}`, 
   }, 
 
   { 
     name: 'Referral Request — Cold LinkedIn Connection', 
     category: 'referral_request', 
     subject: 'Referral for {{RoleName}} at {{Company}} — fellow {{SharedBackground}}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I know this is coming out of the blue, but|I hope you don't mind the cold message — } I found your profile {while researching|while looking into} {{Company}} and {noticed we both|saw that we share a} {{SharedBackground}}. 
 
 I'm {actively|currently} {exploring|looking for} {my next role|new opportunities} and {the|a} {{RoleName}} position at {{Company}} {caught my eye|looks like a great fit|really excites me}. {Would you be open to|I'd love to ask if you could} {referring me|putting in a referral}? {I know it's a big ask from a stranger — I'd happily return the favor in any way I can.|No worries at all if that's not something you're comfortable with.} 
 
 {I'm attaching my resume here.|I can share my resume and portfolio if helpful.} {I'd love to have a 10-minute call if you'd like to learn more about my background.|Happy to chat briefly if you'd like to know more.} 
 
 {Thank you for your time!|Really appreciate it either way.} 
 {{YourName}}`, 
   }, 
 
   // ── Mentorship Request ────────────────────────────────────────────────────── 
   { 
     name: 'Mentorship Request — Genuine', 
     category: 'mentorship_request', 
     subject: '{Would you be open to|Could I ask for} {a quick chat|15 minutes|a brief call}? — {{YourName}}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I've been following your work on|I came across your writing about|I've admired your career path in} {{TheirExpertise}} for {a while|some time} and {I'm genuinely inspired by|I really respect} {what you've built|the path you've taken|your perspective on it}. 
 
 I'm {currently|at a point where I'm} {navigating|thinking about|working through} {{YourChallenge}}, and {I think your perspective would be invaluable|I believe you've been exactly where I am|I'd love to hear how you approached} {{SpecificQuestion}}. 
 
 {I'm not asking for a commitment — just|All I'm looking for is} {a 15-minute call|a brief conversation|a quick chat} {at your convenience|whenever works for you|if you ever have a spare moment}. {I'll come prepared with specific questions and respect your time completely.|I promise to be concise and prepared.} 
 
 {Thank you so much for even considering this.|I really appreciate you taking the time to read this.} 
 {{YourName}}`, 
   }, 
 
   { 
     name: 'Mentorship Request — Specific Insight Ask', 
     category: 'mentorship_request', 
     subject: 'One question about {{SpecificTopic}} — from a {{YourRole}} admirer', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I'll keep this short.|Quick one.} I {read|watched|came across} {your|the} {{ContentTheyCreated}} and {one thing stood out to me:|I had a question I couldn't shake:} {{SpecificQuestion}}. 
 
 I'm a {{YourRole}} {currently|right now} {working on|building|navigating} {{YourSituation}}, and {your experience with|your approach to} {{TheirExpertise}} {seems directly relevant|is exactly the perspective I need}. 
 
 {Would you be open to|Could I schedule} {a 10-minute call|a quick chat|15 minutes} {to dig into this?|to explore this?} {I'm flexible on timing and happy to work around your schedule.|I'll make it easy and quick.} 
 
 {Thank you — I genuinely appreciate it.|Thanks for reading this far.} 
 {{YourName}}`, 
   }, 
 
   // ── Investor Pitch ────────────────────────────────────────────────────────── 
   { 
     name: 'Investor Pitch — Traction-Led', 
     category: 'investor_pitch', 
     subject: '{{StartupName}} — {{OneLiner}} ({traction highlight|{{TractionMetric}}})', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I'm reaching out because|I came across your portfolio and|I've been following your investments in} {{TheirFocusArea}} — {it aligns closely with|which is exactly where} {{StartupName}} {plays|operates|is building}. 
 
 {Quick overview:|In one line:} {{StartupName}} {helps|enables|is building} {{OneLiner}}. 
 
 {Here's where we are:|Our current traction:} 
 — {{TractionMetric1}} 
 — {{TractionMetric2}} 
 — {{TractionMetric3}} 
 
 {We're raising|We're currently closing} {{RoundSize}} {to|in order to} {{UseOfFunds}}. 
 
 {I'd love to send over our deck if you're open to it.|Would you be open to a 20-minute intro call?|Happy to share more if this is in your wheelhouse.} 
 
 {{YourName}} 
 {{StartupName}}`, 
   }, 
 
   { 
     name: 'Investor Pitch — Problem-First', 
     category: 'investor_pitch', 
     subject: '{$X billion problem|The problem with|Why} {{IndustryProblem}} — {{StartupName}}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {{IndustryProblem}} is a {massive|significant|largely ignored} problem. {{ProblemStat}}. 
 
 {{StartupName}} {solves this by|fixes this with|has built} {{Solution}}. {Unlike|Different from} {{Competitors}}, we {{Differentiator}}. 
 
 {We've validated this with|Early traction:} {{TractionMetric}}. Our {customers|users|clients} include {{CustomerType}}. 
 
 {We're raising|Currently raising} {{RoundSize}}. {I'd love to share our deck.|Open to a quick call if this fits your thesis.} 
 
 {{YourName}} 
 {{StartupName}} — {{WebsiteURL}}`, 
   }, 
 
   // ── Partnership ───────────────────────────────────────────────────────────── 
   { 
     name: 'Partnership Proposal — Direct', 
     category: 'partnership', 
     subject: 'Partnership idea — {{YourCompany}} × {{TheirCompany}}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I've been thinking about|I had an idea about} {a potential partnership between|how} {{YourCompany}} {and|could work with} {{TheirCompany}} {that I think could be valuable for both sides.|that might be worth exploring.} 
 
 {Here's the idea:|Quick pitch:} {{PartnershipIdea}}. 
 
 {The way I see it working:|Specifically:} 
 — {Your side gains:|You get:} {{TheirBenefit}} 
 — {Our side gains:|We get:} {{YourBenefit}} 
 
 {We already have|We work with} {{SocialProof}}, {so we're not starting from scratch.|which gives us a solid foundation for this.} 
 
 {Worth a 20-minute call to explore?|Open to a quick chat?|Would you be open to exploring this?} 
 
 {{YourName}}, {{YourRole}} at {{YourCompany}}`, 
   }, 
 
   { 
     name: 'Partnership — Integration / Co-marketing', 
     category: 'partnership', 
     subject: '{Co-marketing|Integration|Collaboration} idea for {{TheirCompany}} + {{YourCompany}}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {Our users keep asking us about|We've noticed a lot of overlap between} {{TheirProduct}} and {{YourProduct}}. {I think there's a natural partnership here.|I think we're solving adjacent problems for the same people.} 
 
 {Specifically, I was thinking:|My idea:} {{SpecificIdea}}. 
 
 {We have|Our audience includes} {{YourAudienceSize}} {{AudienceDescription}} — {very aligned with|exactly the kind of customers who use} {{TheirProduct}}. 
 
 {Would you be open to a 20-minute call to explore this?|Happy to sketch out what this could look like on a call.} 
 
 {{YourName}} 
 {{YourCompany}}`, 
   }, 
 
   // ── Product Demo ──────────────────────────────────────────────────────────── 
   { 
     name: 'Product Demo Request — Value Hook', 
     category: 'product_demo', 
     subject: '{How|The way} {{Company}} could {fix|solve|improve} {{PainPoint}} — {{YourProduct}}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I noticed|I saw|I came across} {{Trigger}} — {which made me think|which is why} {{YourProduct}} {could be a real fit for|might help} {{Company}}. 
 
 {In short,|Quick background:} {{YourProduct}} {helps teams like yours|enables companies like {{Company}} to} {{ValueProp}} — {typically|usually} resulting in {{QuantifiedResult}}. 
 
 {A few companies we work with|Our customers include} {{SocialProof}}. 
 
 {I'd love to show you a 20-minute demo — no pitch, just the product.|Would you be open to a quick product walkthrough?|Worth 20 minutes to see if it fits?} 
 
 {No pressure at all — happy to send more context first if you'd prefer.|I can send a 2-minute video overview first if you'd prefer not to do a live call.} 
 
 {{YourName}} 
 {{YourCompany}} — {{WebsiteURL}}`, 
   }, 
 
   { 
     name: 'Product Demo — Problem-Aware', 
     category: 'product_demo', 
     subject: 'Re: {{PainPoint}} at {{Company}} — have you tried {{ApproachType}}?', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {Teams in {{Industry}} are|Most {{CompanyType}} companies we talk to are} {still|currently} {struggling with|dealing with} {{PainPoint}}. {It's a harder problem than it looks.|The usual solutions just don't cut it.} 
 
 {{YourProduct}} {takes a different approach:|was built specifically for this:} {{Differentiator}}. 
 
 {Results from customers like {{CustomerExample}}:|What we're seeing:} 
 — {{Result1}} 
 — {{Result2}} 
 
 {Would it make sense to connect for 20 minutes?|Worth a quick demo?|Open to seeing it in action?} 
 
 {{YourName}}`, 
   }, 
 
   // ── One-Pager / Executive Summary ────────────────────────────────────────── 
   { 
     name: 'One-Pager Share — Investor / Partner', 
     category: 'one_pager_share', 
     subject: '{{StartupName}} one-pager — {{OneLiner}}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I'm sharing|Attaching|Sending over} our one-pager for {{StartupName}}. 
 
 {The short version:|TL;DR:} {{OneLiner}}. 
 
 {We're currently|At the moment we're} {{CurrentStatus}} — {{TractionHighlight}}. 
 
 {Happy to walk you through it on a call if you'd like more context.|The deck has more detail, but this gives the 60-second version.} 
 
 {{YourName}} 
 {{StartupName}}`, 
   }, 
 
   { 
     name: 'One-Pager Share — Executive Decision Maker', 
     category: 'one_pager_share', 
     subject: 'Quick summary — how {{YourCompany}} {can|could} help {{TheirCompany}}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I put together|I'm sharing|Attaching} a short one-pager that outlines {how|the way} {{YourCompany}} {could help|helps} {{TheirCompany}} {with|solve|improve} {{PainPoint}}. 
 
 {It covers:|In brief, it shows:} 
 — {{Point1}} 
 — {{Point2}} 
 — {{Point3}} 
 
 {I know your time is limited — this is designed to be read in under 2 minutes.|One page, under 2 minutes to read.} 
 
 {Worth a quick look?|Let me know if it's worth a 15-minute call.|Happy to answer any questions.} 
 
 {{YourName}}`, 
   }, 
 
   // ── Recruiter Reach ───────────────────────────────────────────────────────── 
   { 
     name: 'Recruiter Outreach — Proactive', 
     category: 'recruiter_reach', 
     subject: '{{YourRole}} open to {opportunities|new roles|the right opportunity}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I'm reaching out because|I came across your profile and} {I know you work with companies in|you specialize in placing talent in} {{Industry}}. 
 
 {I'm currently|I'm actively} {exploring|open to|looking for} {my next role|new opportunities} in {{TargetRole}}. {Quick background:|About me:} 
 
 — {{YearsExp}} years in {{Skill1}} and {{Skill2}} 
 — {Previously at|Most recently at} {{PreviousCompany}} where I {{RecentAchievement}} 
 — {Looking for|Targeting} {{IdealRole}} at {{IdealCompanyType}} 
 
 {I've attached my resume.|Happy to send my resume and portfolio.} {Would love to connect if you're working on anything relevant.|Let me know if anything in your pipeline could be a fit.} 
 
 {{YourName}}`, 
   }, 
 
   { 
     name: 'Recruiter Outreach — Specific Role', 
     category: 'recruiter_reach', 
     subject: 'Re: {{RoleName}} role — {{YourName}} ({strong match|relevant background|{{YearsExp}} yrs exp})', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I came across|I saw|I noticed} {the|your} {{RoleName}} role {you posted|you're recruiting for|at {{Company}}} and {I think I could be a strong fit.|my background aligns closely.} 
 
 {Specifically:|Here's why I think I'm relevant:} 
 — {{Qualification1}} 
 — {{Qualification2}} 
 — {{RecentAchievement}} 
 
 {I'm attaching my resume for your consideration.|Happy to send my resume — just let me know.} 
 
 {Would you be open to a 15-minute call to discuss?|Is it worth a quick call to see if there's a fit?} 
 
 {{YourName}}`, 
   }, 
 
   // ── Community Invite ──────────────────────────────────────────────────────── 
   { 
     name: 'Community Invite — Warm', 
     category: 'community_invite', 
     subject: 'Invite to {{CommunityName}} — thought of you', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {I've been building|I run|I'm part of} {{CommunityName}}, {a community for|a group of} {{CommunityDescription}}. 
 
 {I came across your work on|I've been following your} {{TheirWork}} and {immediately thought|I thought straight away} {you'd be a great fit.|this would be right up your alley.} 
 
 {We're a small, curated group — right now about|The community is} {{MemberCount}} {people who} {{WhatTheyDo}}. {It's|The vibe is} {{CommunityVibe}}. 
 
 {Would you be open to joining?|Interested in checking it out?|I'd love to have you in the group.} 
 
 {{YourName}}`, 
   }, 
 
   { 
     name: 'Community Invite — Cold', 
     category: 'community_invite', 
     subject: '{You might like|Have you heard of} {{CommunityName}}?', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {Quick intro:|One sentence:} I {run|co-founded|help organize} {{CommunityName}} — {{CommunityDescription}}. 
 
 {I came across your work and|Based on your background in {{TheirField}},} {I think you'd get a lot out of it|I think you'd add a ton of value|you'd fit right in}. 
 
 {We have members from|The community includes people from} {{NotableMembers}}. {We meet|The group gets together} {{CommunityFrequency}} {to|and} {{CommunityActivity}}. 
 
 {No commitment required — happy to add you to our next session.|Totally free and no sales pitch. Just good people.} 
 
 {Interested?|Worth checking out?} 
 
 {{YourName}}`, 
   }, 
 
   // ── Custom ────────────────────────────────────────────────────────────────── 
   { 
     name: 'Custom Blank Template', 
     category: 'custom', 
     subject: '{Subject line option 1|Subject line option 2|Subject line option 3}', 
     body: `{Hi|Hello|Hey} {{FirstName}}, 
 
 {Opening line option 1.|Opening line option 2.|Opening line option 3.} 
 
 {Body paragraph option A.|Body paragraph option B.} 
 
 {Call to action option 1?|Call to action option 2?} 
 
 {{YourName}}`, 
   }, 
 
   { 
     name: 'Custom — Follow Up', 
     category: 'custom', 
     subject: '{Following up|Circling back|Quick follow-up} — {{OriginalTopicShort}}', 
     body: `{Hi|Hello} {{FirstName}}, 
 
 {Wanted to follow up on|Just circling back on|Following up on} my {previous message|note from last week|email about} {{OriginalTopic}}. 
 
 {I know things get busy — no worries if the timing isn't right.|Totally understand if this isn't a priority right now.} 
 
 {Still happy to connect if you're open to it.|Let me know if there's a better time to reach out.} 
 
 {{YourName}}`, 
   }, 
 ]