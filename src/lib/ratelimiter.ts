export interface RateLimitResult { 
   allowed: boolean 
   reason?: string 
   dailySent: number 
   dailyLimit: number 
   nextAllowedAt?: string 
 } 
 
 // Get user's daily send limit based on account age 
 async function getDailyLimit(db: D1Database, userId: string): Promise<number> { 
   const user = await db 
     .prepare('SELECT created_at, daily_send_limit FROM users WHERE id = ?') 
     .bind(userId) 
     .first<{ created_at: string; daily_send_limit: number }>() 
 
   if (!user) return 20 
 
   // Custom limit set by user (via settings) 
   if (user.daily_send_limit) return user.daily_send_limit 
 
   const createdAt = new Date(user.created_at) 
   const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) 
 
   if (daysSinceCreation < 7)  return 20 
   if (daysSinceCreation < 30) return 50 
   return 200 
 } 
 
 // Count emails sent today by this user 
 async function getDailySentCount(db: D1Database, userId: string): Promise<number> { 
   const result = await db 
     .prepare(`SELECT COUNT(*) as count FROM outreach_log 
               WHERE user_id = ? AND status = 'sent' 
               AND date(sent_at) = date('now')`) 
     .bind(userId) 
     .first<{ count: number }>() 
   return result?.count ?? 0 
 } 
 
 // Check bounce rate — auto-suspend if > 3% 
 async function checkBounceRate(db: D1Database, userId: string, campaignId: string): Promise<{ 
   bounceRate: number 
   shouldSuspend: boolean 
 }> { 
   const result = await db 
     .prepare(`SELECT 
         COUNT(*) as total, 
         SUM(CASE WHEN bounced = 1 THEN 1 ELSE 0 END) as bounced 
       FROM outreach_log 
       WHERE campaign_id = ?`) 
     .bind(campaignId) 
     .first<{ total: number; bounced: number }>() 
 
   if (!result || result.total < 10) return { bounceRate: 0, shouldSuspend: false } 
 
   const bounceRate = result.bounced / result.total 
   return { bounceRate, shouldSuspend: bounceRate > 0.03 } 
 } 
 
 // Check if this email was sent recently (dedup protection) 
 async function wasRecentlySent( 
   db: D1Database, 
   userId: string, 
   recipientEmail: string, 
   windowDays = 30 
 ): Promise<boolean> { 
   const result = await db 
     .prepare(`SELECT id FROM outreach_log 
               WHERE user_id = ? AND recipient_email = ? AND status = 'sent' 
               AND datetime(sent_at) > datetime('now', '-' || ? || ' days') 
               LIMIT 1`) 
     .bind(userId, recipientEmail, windowDays) 
     .first<{ id: string }>() 
   return !!result 
 } 
 
 // Check domain send frequency (max 3 per domain per day) 
 async function getDomainSentToday( 
   db: D1Database, 
   userId: string, 
   domain: string 
 ): Promise<number> { 
   const result = await db 
     .prepare(`SELECT COUNT(*) as count FROM outreach_log 
               WHERE user_id = ? AND recipient_email LIKE ? AND status = 'sent' 
               AND date(sent_at) = date('now')`) 
     .bind(userId, `%@${domain}`) 
     .first<{ count: number }>() 
   return result?.count ?? 0 
 } 
 
 export async function checkRateLimit( 
   db: D1Database, 
   userId: string, 
   campaignId: string, 
   recipientEmail: string 
 ): Promise<RateLimitResult> { 
   // 1. Daily limit check 
   const [dailyLimit, dailySent] = await Promise.all([ 
     getDailyLimit(db, userId), 
     getDailySentCount(db, userId), 
   ]) 
 
   if (dailySent >= dailyLimit) { 
     return { 
       allowed: false, 
       reason: `Daily limit of ${dailyLimit} emails reached. Resets at midnight.`, 
       dailySent, 
       dailyLimit, 
     } 
   } 
 
   // 2. Duplicate check (30-day window) 
   const recentlySent = await wasRecentlySent(db, userId, recipientEmail) 
   if (recentlySent) { 
     return { 
       allowed: false, 
       reason: `Already sent to ${recipientEmail} in the last 30 days.`, 
       dailySent, 
       dailyLimit, 
     } 
   } 
 
   // 3. Domain frequency check (max 3/day per domain) 
   const domain = recipientEmail.split('@')[1] 
   if (domain) { 
     const domainCount = await getDomainSentToday(db, userId, domain) 
     if (domainCount >= 3) { 
       return { 
         allowed: false, 
         reason: `Already sent to 3 addresses at ${domain} today. Max 3 per domain per day.`, 
         dailySent, 
         dailyLimit, 
       } 
     } 
   } 
 
   // 4. Bounce rate check for this campaign 
   const { bounceRate, shouldSuspend } = await checkBounceRate(db, userId, campaignId) 
   if (shouldSuspend) { 
     return { 
       allowed: false, 
       reason: `Campaign suspended: bounce rate is ${(bounceRate * 100).toFixed(1)}% (limit 3%). Fix your email list before resuming.`, 
       dailySent, 
       dailyLimit, 
     } 
   } 
 
   return { allowed: true, dailySent, dailyLimit } 
 } 
 
 // Random delay between sends (90–180 seconds) 
 export function randomSendDelay(): number { 
   return Math.floor(Math.random() * 90_000) + 90_000 
 }