/**
 * Starter templates seeded for every new organization.
 * Covers the major services a digital agency would onboard clients for.
 */

interface StarterTask {
  title: string
  description: string
  is_client_task: boolean
  requires_approval: boolean
  is_asset_required: boolean
  default_due_days: number
  sort_order: number
}

interface StarterPhase {
  name: string
  sort_order: number
  tasks: StarterTask[]
}

interface StarterTemplate {
  name: string
  description: string
  phases: StarterPhase[]
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  // ─────────────────────────────────────────────
  // 1. WEBSITE DEVELOPMENT
  // ─────────────────────────────────────────────
  {
    name: 'Website Development',
    description: 'End-to-end website design and development for new or redesigned sites.',
    phases: [
      {
        name: 'Discovery & Kickoff',
        sort_order: 0,
        tasks: [
          { title: 'Kickoff call scheduled & completed', description: 'Align on project goals, timeline, and communication cadence.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Website discovery questionnaire completed', description: 'Client fills out questionnaire covering business goals, audience, competitors, and preferred style.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 1 },
          { title: 'Logo & brand assets uploaded', description: 'Upload logo files (SVG/PNG with transparent background) and any brand guidelines.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 2 },
          { title: 'Domain & hosting access provided', description: 'Share domain registrar login or DNS delegation. Share existing hosting credentials if applicable.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 3 },
          { title: 'Sitemap & page structure approved', description: 'Agency presents proposed site structure; client signs off before design begins.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 10, sort_order: 4 },
        ],
      },
      {
        name: 'Design',
        sort_order: 1,
        tasks: [
          { title: 'Mood board / style direction created', description: 'Internal: create 2–3 style directions for client review.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 14, sort_order: 0 },
          { title: 'Style direction approved', description: 'Client selects and approves the visual direction.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 17, sort_order: 1 },
          { title: 'Homepage mockup designed', description: 'Internal: design full homepage in Figma or Adobe XD.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 2 },
          { title: 'Homepage mockup approved', description: 'Client reviews and approves homepage design before inner pages are built.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 24, sort_order: 3 },
          { title: 'Website copy & content submitted', description: 'Client provides all written copy, images, and media for every page.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 28, sort_order: 4 },
        ],
      },
      {
        name: 'Development',
        sort_order: 2,
        tasks: [
          { title: 'Staging environment set up', description: 'Internal: configure staging server/environment for development.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 30, sort_order: 0 },
          { title: 'All pages built on staging', description: 'Internal: develop all pages, forms, and functionality.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 42, sort_order: 1 },
          { title: 'Client review on staging', description: 'Client walks through the staging site and submits revision requests.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 2 },
          { title: 'Revisions completed', description: 'Internal: address all client-requested revisions from staging review.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 49, sort_order: 3 },
          { title: 'Cross-browser & mobile QA completed', description: 'Internal: test on Chrome, Firefox, Safari, and mobile devices.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 51, sort_order: 4 },
        ],
      },
      {
        name: 'Launch',
        sort_order: 3,
        tasks: [
          { title: 'Final launch approval sign-off', description: 'Client gives written approval to go live.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 53, sort_order: 0 },
          { title: 'Site deployed to production', description: 'Internal: push live, configure DNS, enable SSL.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 55, sort_order: 1 },
          { title: 'Post-launch QA completed', description: 'Internal: verify all pages, forms, and links work on the live domain.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 56, sort_order: 2 },
          { title: 'Google Analytics & Search Console configured', description: 'Set up GA4 and GSC; share access with client.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 57, sort_order: 3 },
          { title: 'Handoff & training call completed', description: 'Walk client through CMS, how to make edits, and who to contact for support.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 60, sort_order: 4 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 2. SEO
  // ─────────────────────────────────────────────
  {
    name: 'Search Engine Optimization (SEO)',
    description: 'Audit, strategy, and implementation for organic search growth.',
    phases: [
      {
        name: 'Onboarding & Access',
        sort_order: 0,
        tasks: [
          { title: 'SEO kickoff call completed', description: 'Discuss business goals, target audience, priority pages, and timeline.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Google Search Console access granted', description: 'Client adds agency as a verified owner in Google Search Console.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 1 },
          { title: 'Google Analytics access granted', description: 'Client grants Editor access to the GA4 property.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 2 },
          { title: 'CMS / website access provided', description: 'Client provides login credentials or team member access to the CMS.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 3 },
          { title: 'Business & audience questionnaire completed', description: 'Client fills out form covering products/services, target customers, geographic focus, and top competitors.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 4 },
        ],
      },
      {
        name: 'Audit & Research',
        sort_order: 1,
        tasks: [
          { title: 'Technical SEO audit completed', description: 'Internal: crawl site for indexing issues, broken links, page speed, mobile usability, and schema.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 14, sort_order: 0 },
          { title: 'Keyword research completed', description: 'Internal: identify target keyword clusters based on search volume, intent, and difficulty.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 16, sort_order: 1 },
          { title: 'Competitor analysis completed', description: 'Internal: analyze top 3–5 organic competitors for gap opportunities.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 18, sort_order: 2 },
          { title: 'SEO audit & strategy report approved', description: 'Client reviews findings, priority recommendations, and 90-day roadmap.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 21, sort_order: 3 },
        ],
      },
      {
        name: 'On-Page & Technical Implementation',
        sort_order: 2,
        tasks: [
          { title: 'Technical fixes implemented', description: 'Internal: resolve crawl errors, improve page speed, fix broken links, add schema markup.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 28, sort_order: 0 },
          { title: 'Title tags & meta descriptions optimized', description: 'Internal: rewrite priority page titles and meta descriptions.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 30, sort_order: 1 },
          { title: 'Content optimization completed', description: 'Internal: update existing pages for target keywords, internal linking, and readability.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 35, sort_order: 2 },
          { title: 'New landing pages / blog content approved', description: 'Client reviews and approves new content before publishing.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 38, sort_order: 3 },
          { title: 'Content published & indexed', description: 'Internal: publish approved content and submit URLs to Search Console.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 40, sort_order: 4 },
        ],
      },
      {
        name: 'Reporting & Ongoing',
        sort_order: 3,
        tasks: [
          { title: 'Rank tracking configured', description: 'Internal: set up rank tracking for agreed keyword set.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 42, sort_order: 0 },
          { title: 'Month 1 performance report delivered', description: 'Share initial baseline metrics, rankings, and traffic data with client.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 1 },
          { title: 'Reporting cadence confirmed', description: 'Client confirms preferred reporting frequency and dashboard access.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 2 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 3. SOCIAL MEDIA MANAGEMENT
  // ─────────────────────────────────────────────
  {
    name: 'Social Media Management',
    description: 'Account setup, content strategy, and ongoing social media management.',
    phases: [
      {
        name: 'Onboarding & Access',
        sort_order: 0,
        tasks: [
          { title: 'Social media kickoff call completed', description: 'Discuss brand voice, content pillars, posting frequency, and platforms.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Social media account access granted', description: 'Client adds agency as admin/manager on all relevant platforms (Facebook, Instagram, LinkedIn, etc.).', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 1 },
          { title: 'Brand assets uploaded', description: 'Upload logos, brand colors, approved fonts, and any existing brand guidelines.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 2 },
          { title: 'Brand voice & audience questionnaire completed', description: 'Client describes tone, what to avoid, target demographics, and key messages.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 3 },
          { title: 'Profile photos & cover images approved', description: 'Agency creates updated profile assets; client approves before publishing.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 10, sort_order: 4 },
        ],
      },
      {
        name: 'Strategy & Content Planning',
        sort_order: 1,
        tasks: [
          { title: 'Content strategy & pillars approved', description: 'Client reviews the proposed content pillars, post types, and content mix.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 14, sort_order: 0 },
          { title: 'Month 1 content calendar approved', description: 'Client reviews and approves all scheduled posts for the first month.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 18, sort_order: 1 },
          { title: 'Photo/video assets provided (Month 1)', description: 'Client uploads any custom photos, videos, or graphics for Month 1 posts.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 18, sort_order: 2 },
          { title: 'Social scheduling tool connected', description: 'Internal: connect accounts to scheduling platform and schedule Month 1 posts.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 20, sort_order: 3 },
        ],
      },
      {
        name: 'Launch & Go-Live',
        sort_order: 2,
        tasks: [
          { title: 'Profiles updated & optimized', description: 'Internal: update all bios, links, contact info, and profile images.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 0 },
          { title: 'First posts published', description: 'Launch organic posting per the approved content calendar.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 22, sort_order: 1 },
          { title: 'Community management process confirmed', description: 'Client confirms response time expectations and escalation process for comments/DMs.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 22, sort_order: 2 },
          { title: 'Month 1 performance report delivered', description: 'Share reach, engagement, follower growth, and top-performing content.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 3 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 4. PAID ADVERTISING (PPC / Google & Meta Ads)
  // ─────────────────────────────────────────────
  {
    name: 'Paid Advertising (PPC)',
    description: 'Google Ads and/or Meta Ads campaign setup, targeting, and launch.',
    phases: [
      {
        name: 'Onboarding & Access',
        sort_order: 0,
        tasks: [
          { title: 'PPC kickoff call completed', description: 'Discuss campaign goals, budget, target audience, geographic focus, and KPIs.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Google Ads account access granted', description: 'Client shares Google Ads account access via Manager Account link request.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 1 },
          { title: 'Meta Business Manager access granted', description: 'Client adds agency as partner in Meta Business Manager.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 2 },
          { title: 'Billing & payment method confirmed', description: 'Client confirms ad spend billing is set up and budget allocation approved.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 5, sort_order: 3 },
          { title: 'Website pixel / conversion tracking verified', description: 'Internal: verify Google Tag Manager, GA4 conversions, and Meta Pixel are firing correctly.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 4 },
          { title: 'Creative assets uploaded', description: 'Client provides ad images, videos, headlines, and descriptions per the creative brief.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 10, sort_order: 5 },
        ],
      },
      {
        name: 'Campaign Build',
        sort_order: 1,
        tasks: [
          { title: 'Audience targeting & keyword research completed', description: 'Internal: build keyword lists, audience segments, and remarketing pools.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 12, sort_order: 0 },
          { title: 'Campaign structure & budget plan approved', description: 'Client reviews campaign breakdown, ad groups, budgets, and bidding strategy.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 14, sort_order: 1 },
          { title: 'Ad copy & creative approved', description: 'Client reviews and approves all ad headlines, descriptions, and creative assets.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 16, sort_order: 2 },
          { title: 'Landing pages reviewed & confirmed', description: 'Internal: QA destination URLs, load speed, and conversion actions on all landing pages.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 17, sort_order: 3 },
          { title: 'Campaigns built in platform', description: 'Internal: build all campaigns, ad groups, ads, and targeting in Google/Meta.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 19, sort_order: 4 },
        ],
      },
      {
        name: 'Launch & Optimization',
        sort_order: 2,
        tasks: [
          { title: 'Campaigns activated', description: 'Internal: enable campaigns and confirm ads are serving.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 0 },
          { title: 'Launch check-in call completed', description: 'Review early data, confirm ads are running, address any disapprovals.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 24, sort_order: 1 },
          { title: 'Week 2 optimization completed', description: 'Internal: pause underperforming ads, adjust bids, add negative keywords.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 28, sort_order: 2 },
          { title: 'Month 1 performance report delivered', description: 'Share impressions, clicks, CTR, CPC, conversions, and ROAS with client.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 3 },
          { title: 'Reporting cadence & dashboard access confirmed', description: 'Client confirms preferred reporting format and frequency.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 4 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 5. EMAIL MARKETING
  // ─────────────────────────────────────────────
  {
    name: 'Email Marketing',
    description: 'Platform setup, list migration, template design, and campaign launch.',
    phases: [
      {
        name: 'Onboarding & Platform Setup',
        sort_order: 0,
        tasks: [
          { title: 'Email marketing kickoff call completed', description: 'Discuss goals, send frequency, list size, current platform, and target segments.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Email platform access granted', description: 'Client adds agency to Klaviyo / Mailchimp / HubSpot / ActiveCampaign as admin.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 1 },
          { title: 'Sending domain authenticated', description: 'Internal: configure SPF, DKIM, and DMARC records for the client\'s sending domain.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 2 },
          { title: 'Existing subscriber list exported & uploaded', description: 'Client exports current list and provides in CSV format for import.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 3 },
          { title: 'List segmentation strategy approved', description: 'Client reviews and approves how the list will be segmented.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 10, sort_order: 4 },
        ],
      },
      {
        name: 'Template Design',
        sort_order: 1,
        tasks: [
          { title: 'Brand assets uploaded', description: 'Client provides logo, brand colors, and fonts for email template design.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 0 },
          { title: 'Master email template designed', description: 'Internal: design branded master email template (header, body, footer, CTA button styles).', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 14, sort_order: 1 },
          { title: 'Email template approved', description: 'Client reviews and approves the master email template.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 17, sort_order: 2 },
          { title: 'Welcome / automation email copy approved', description: 'Client reviews and approves copy for the welcome series and any key automations.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 21, sort_order: 3 },
        ],
      },
      {
        name: 'Automations & Launch',
        sort_order: 2,
        tasks: [
          { title: 'Welcome email series built', description: 'Internal: build and test the welcome automation sequence.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 24, sort_order: 0 },
          { title: 'Sign-up form configured & embedded', description: 'Internal: create and embed the opt-in form on the client\'s website.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 25, sort_order: 1 },
          { title: 'Test send reviewed & approved', description: 'Client receives test email and confirms layout, links, and content are correct.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 27, sort_order: 2 },
          { title: 'First campaign sent', description: 'Internal: send the first broadcast campaign to the approved segment.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 30, sort_order: 3 },
          { title: 'Campaign performance report delivered', description: 'Share open rate, click rate, unsubscribes, and revenue (if applicable) with client.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 37, sort_order: 4 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 6. BRANDING & IDENTITY
  // ─────────────────────────────────────────────
  {
    name: 'Branding & Identity',
    description: 'Logo design, brand system, and complete brand guidelines delivery.',
    phases: [
      {
        name: 'Discovery',
        sort_order: 0,
        tasks: [
          { title: 'Brand discovery kickoff call completed', description: 'Explore business vision, values, target audience, competitors, and aesthetic preferences.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Brand questionnaire completed', description: 'Client fills out in-depth questionnaire covering personality, brand adjectives, likes/dislikes, and inspiration.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 1 },
          { title: 'Competitor & inspiration review submitted', description: 'Client provides 3–5 brands they admire and 3–5 they want to stand apart from.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 2 },
          { title: 'Existing assets uploaded (if any)', description: 'Client uploads any current logos, marketing materials, or brand elements.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 3 },
        ],
      },
      {
        name: 'Concept Development',
        sort_order: 1,
        tasks: [
          { title: 'Mood board created & approved', description: 'Client reviews and selects a visual direction from the presented mood board options.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 12, sort_order: 0 },
          { title: 'Logo concepts presented', description: 'Internal: present 3 distinct logo directions based on approved mood board.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 18, sort_order: 1 },
          { title: 'Logo direction selected', description: 'Client selects one logo direction for refinement.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 21, sort_order: 2 },
          { title: 'Logo refinement & revisions completed', description: 'Internal: refine selected logo concept with up to two rounds of revisions.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 27, sort_order: 3 },
          { title: 'Final logo approved', description: 'Client gives final approval on the logo before full brand system is built.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 30, sort_order: 4 },
        ],
      },
      {
        name: 'Brand System & Delivery',
        sort_order: 2,
        tasks: [
          { title: 'Color palette & typography system finalized', description: 'Internal: define primary, secondary, and accent colors plus heading/body typeface pairing.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 35, sort_order: 0 },
          { title: 'Brand guidelines document created', description: 'Internal: produce full brand guidelines PDF covering logo usage, colors, typography, imagery, and do/don\'ts.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 42, sort_order: 1 },
          { title: 'Brand guidelines approved', description: 'Client reviews and approves the complete brand guidelines document.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 45, sort_order: 2 },
          { title: 'Final asset package delivered', description: 'Internal: deliver all logo files (SVG, PNG, PDF) in all approved color variations plus the brand guidelines PDF.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 47, sort_order: 3 },
          { title: 'Asset delivery confirmed by client', description: 'Client confirms receipt of all brand files and the project is formally closed.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 49, sort_order: 4 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 7. E-COMMERCE LAUNCH
  // ─────────────────────────────────────────────
  {
    name: 'E-Commerce Launch',
    description: 'Full e-commerce store setup covering platform, products, payments, and go-live.',
    phases: [
      {
        name: 'Setup & Access',
        sort_order: 0,
        tasks: [
          { title: 'E-commerce kickoff call completed', description: 'Discuss platform choice (Shopify, WooCommerce, etc.), product catalog size, payment needs, and launch date.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Platform access / store created', description: 'Client creates the store and invites agency as staff or collaborator.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 1 },
          { title: 'Domain access provided', description: 'Client provides domain registrar access or points domain to the store platform.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 5, sort_order: 2 },
          { title: 'Brand assets uploaded', description: 'Upload logo, brand colors, fonts, and any existing photography.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 3 },
          { title: 'Product catalog spreadsheet submitted', description: 'Client provides all product names, SKUs, descriptions, prices, variants, and inventory counts in a spreadsheet.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 10, sort_order: 4 },
          { title: 'Product photography uploaded', description: 'Client uploads all product images (minimum 1000x1000px, white or clean background).', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 14, sort_order: 5 },
        ],
      },
      {
        name: 'Store Build',
        sort_order: 1,
        tasks: [
          { title: 'Theme selected & customized', description: 'Internal: install and customize the approved theme to match brand guidelines.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 18, sort_order: 0 },
          { title: 'Homepage design approved', description: 'Client reviews and approves the homepage layout before all pages are built.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 21, sort_order: 1 },
          { title: 'Products imported & configured', description: 'Internal: upload all products, set prices, variants, inventory, and shipping weights.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 26, sort_order: 2 },
          { title: 'Collections & navigation configured', description: 'Internal: set up product collections, menus, and category pages.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 28, sort_order: 3 },
          { title: 'Payment gateway configured', description: 'Internal: connect and test Stripe/PayPal/Shopify Payments with a test transaction.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 30, sort_order: 4 },
          { title: 'Shipping zones & rates configured', description: 'Internal: set up all domestic and international shipping options and rates.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 31, sort_order: 5 },
          { title: 'Tax settings configured', description: 'Internal: configure tax rates per region based on client\'s accountant guidance.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 32, sort_order: 6 },
        ],
      },
      {
        name: 'Review & Launch',
        sort_order: 2,
        tasks: [
          { title: 'Full store review on staging', description: 'Client walks through entire store, reviews all products, pages, and checkout flow.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 36, sort_order: 0 },
          { title: 'Revisions completed', description: 'Internal: implement all client feedback from the staging review.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 40, sort_order: 1 },
          { title: 'Legal pages confirmed (Privacy, Terms, Refunds)', description: 'Client reviews and approves all legal/policy pages before launch.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 41, sort_order: 2 },
          { title: 'Final launch approval given', description: 'Client provides written sign-off to go live.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 43, sort_order: 3 },
          { title: 'Store launched & domain live', description: 'Internal: remove password protection, connect domain, and verify checkout end-to-end.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 4 },
          { title: 'Analytics & tracking verified post-launch', description: 'Internal: confirm GA4, Meta Pixel, and conversion events are firing on the live store.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 46, sort_order: 5 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 8. CONTENT MARKETING
  // ─────────────────────────────────────────────

  {
    name: 'Content Marketing',
    description: 'Content strategy, editorial calendar, production, and distribution setup.',
    phases: [
      {
        name: 'Strategy & Planning',
        sort_order: 0,
        tasks: [
          { title: 'Content marketing kickoff call completed', description: 'Discuss goals, target audience, existing content, preferred formats, and publication cadence.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Website & CMS access granted', description: 'Client provides Editor or Author access to the CMS (WordPress, Webflow, etc.).', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 1 },
          { title: 'Audience & goals questionnaire completed', description: 'Client defines target reader personas, content goals (SEO, leads, authority), and topics to avoid.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 2 },
          { title: 'Existing content audit completed', description: 'Internal: audit current blog/content library for quality, gaps, and repurposing opportunities.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 10, sort_order: 3 },
          { title: 'Content strategy & topic clusters approved', description: 'Client reviews and approves the proposed content pillars, topic clusters, and 90-day editorial calendar.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 14, sort_order: 4 },
        ],
      },
      {
        name: 'Production',
        sort_order: 1,
        tasks: [
          { title: 'Brand voice & style guide confirmed', description: 'Client reviews and approves the writing style guide (tone, POV, formatting rules, terms to use/avoid).', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 16, sort_order: 0 },
          { title: 'Month 1 content briefs completed', description: 'Internal: create detailed briefs for each Month 1 piece (target keyword, outline, sources, CTA).', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 18, sort_order: 1 },
          { title: 'Month 1 draft articles delivered for review', description: 'Client receives all Month 1 drafts for feedback and approval.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 25, sort_order: 2 },
          { title: 'Subject matter expert input provided', description: 'Client provides any proprietary insights, quotes, or data to enrich the content.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 22, sort_order: 3 },
          { title: 'Final articles published', description: 'Internal: publish approved articles with SEO metadata, featured images, and internal links.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 30, sort_order: 4 },
        ],
      },
      {
        name: 'Distribution & Reporting',
        sort_order: 2,
        tasks: [
          { title: 'Content distribution plan activated', description: 'Internal: share published content across agreed channels (email newsletter, social, etc.).', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 31, sort_order: 0 },
          { title: 'Content performance tracking set up', description: 'Internal: configure GA4 events or dashboards to track article traffic, time-on-page, and conversions.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 32, sort_order: 1 },
          { title: 'Month 1 content report delivered', description: 'Share article traffic, keyword rankings, engagement metrics, and recommendations for Month 2.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 2 },
          { title: 'Month 2 editorial calendar approved', description: 'Client reviews and approves the upcoming month\'s content plan.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 45, sort_order: 3 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 9. MOBILE / WEB APP DEVELOPMENT
  // ─────────────────────────────────────────────
  {
    name: 'App Development',
    description: 'Discovery, design, development, and launch of a mobile or web application.',
    phases: [
      {
        name: 'Discovery & Requirements',
        sort_order: 0,
        tasks: [
          { title: 'App development kickoff call completed', description: 'Align on project scope, target platforms (iOS, Android, Web), core features, and launch timeline.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Product requirements questionnaire completed', description: 'Client documents core user stories, must-have features, and any third-party integrations required.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 1 },
          { title: 'Brand assets & design references uploaded', description: 'Client provides logo, brand guidelines, and any design inspiration or existing design files.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 2 },
          { title: 'Technical requirements & integrations confirmed', description: 'Client confirms all required APIs, payment gateways, auth providers, and data sources.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 10, sort_order: 3 },
          { title: 'Project scope & feature list approved', description: 'Client reviews and approves the full feature list, MVP scope, and out-of-scope items to prevent scope creep.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 14, sort_order: 4 },
        ],
      },
      {
        name: 'UX & Design',
        sort_order: 1,
        tasks: [
          { title: 'User flow & wireframes completed', description: 'Internal: map all primary user journeys and create low-fidelity wireframes for key screens.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 0 },
          { title: 'Wireframes approved', description: 'Client reviews and approves all wireframes before high-fidelity design begins.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 24, sort_order: 1 },
          { title: 'High-fidelity UI designs completed', description: 'Internal: design all screens in Figma with branded UI components, color, and typography.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 32, sort_order: 2 },
          { title: 'UI designs approved', description: 'Client reviews and signs off on all screen designs before development begins.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 35, sort_order: 3 },
        ],
      },
      {
        name: 'Development',
        sort_order: 2,
        tasks: [
          { title: 'Development environment & repo set up', description: 'Internal: configure version control, CI/CD pipeline, environments (dev, staging, prod), and project tooling.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 36, sort_order: 0 },
          { title: 'Core features developed', description: 'Internal: build all MVP features per approved scope; conducted in agreed sprint cadence.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 65, sort_order: 1 },
          { title: 'Third-party integrations connected & tested', description: 'Internal: integrate and verify all external services (payments, auth, APIs, analytics).', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 68, sort_order: 2 },
          { title: 'Test credentials / sandbox accounts provided', description: 'Client provides sandbox or test credentials for any client-owned third-party services.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 40, sort_order: 3 },
          { title: 'Internal QA & bug-fix cycle completed', description: 'Internal: full regression testing, device/browser QA, and bug fixes before client review.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 72, sort_order: 4 },
        ],
      },
      {
        name: 'UAT & Launch',
        sort_order: 3,
        tasks: [
          { title: 'User acceptance testing (UAT) completed', description: 'Client tests the staging build against the approved feature list and submits a consolidated feedback document.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 77, sort_order: 0 },
          { title: 'UAT revisions completed', description: 'Internal: address all issues raised during client UAT.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 82, sort_order: 1 },
          { title: 'Final launch sign-off given', description: 'Client provides written approval to release to production / submit to app stores.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 84, sort_order: 2 },
          { title: 'App published / deployed to production', description: 'Internal: release to App Store, Google Play, and/or production web environment.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 87, sort_order: 3 },
          { title: 'Handoff documentation & training delivered', description: 'Provide source code access, deployment docs, admin guide, and a walkthrough call for the client\'s team.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 90, sort_order: 4 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 10. CRM IMPLEMENTATION
  // ─────────────────────────────────────────────
  {
    name: 'CRM Implementation',
    description: 'HubSpot, Salesforce, or similar CRM setup, data migration, and team training.',
    phases: [
      {
        name: 'Discovery & Planning',
        sort_order: 0,
        tasks: [
          { title: 'CRM kickoff call completed', description: 'Map the client\'s sales process, pipeline stages, team roles, and data requirements.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'CRM platform access granted', description: 'Client creates agency admin account in HubSpot / Salesforce / chosen CRM.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 4, sort_order: 1 },
          { title: 'Sales process & pipeline stages documented', description: 'Client provides detailed description of current sales stages, deal properties, and handoff criteria between teams.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 2 },
          { title: 'Existing contact/deal data exported', description: 'Client exports all existing contacts, companies, and deals from current system as CSV/spreadsheet.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 10, sort_order: 3 },
          { title: 'Integration requirements confirmed', description: 'Client lists all tools to integrate (email, calendar, website forms, support desk, accounting).', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 4 },
          { title: 'CRM architecture & configuration plan approved', description: 'Client reviews and approves the proposed pipeline structure, custom properties, team roles, and automation plan.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 14, sort_order: 5 },
        ],
      },
      {
        name: 'Configuration & Build',
        sort_order: 1,
        tasks: [
          { title: 'Pipeline & deal stages configured', description: 'Internal: set up all pipeline stages, required fields, and stage-entry criteria.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 18, sort_order: 0 },
          { title: 'Custom properties & fields created', description: 'Internal: build all custom contact, company, and deal properties as per the approved plan.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 20, sort_order: 1 },
          { title: 'User roles & team permissions configured', description: 'Internal: set up user seats, role-based permissions, and team assignments.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 2 },
          { title: 'Contact & deal data imported & validated', description: 'Internal: clean, map, and import historical data; validate for duplicates and data integrity.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 26, sort_order: 3 },
          { title: 'Key automations & workflows built', description: 'Internal: build agreed lead routing, follow-up sequences, task creation, and notification automations.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 32, sort_order: 4 },
          { title: 'Third-party integrations connected', description: 'Internal: connect and test all approved integrations (email client, calendar, forms, etc.).', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 35, sort_order: 5 },
        ],
      },
      {
        name: 'Review & Training',
        sort_order: 2,
        tasks: [
          { title: 'Client walkthrough & QA session completed', description: 'Internal: demo full CRM configuration to the client; gather feedback on pipeline, properties, and automations.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 38, sort_order: 0 },
          { title: 'Revisions & adjustments completed', description: 'Internal: implement all feedback from the client review session.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 42, sort_order: 1 },
          { title: 'Admin training session completed', description: 'Train CRM admin(s) on managing users, custom properties, reports, and automations.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 2 },
          { title: 'Sales team onboarding session completed', description: 'Train all sales reps on daily CRM usage: logging activities, moving deals, and using automations.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 47, sort_order: 3 },
          { title: 'Training documentation delivered', description: 'Internal: provide written SOPs, video recordings, and a quick-reference guide for the team.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 49, sort_order: 4 },
          { title: '30-day check-in call completed', description: 'Review adoption metrics, address questions, and recommend any configuration refinements after a month of live use.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 79, sort_order: 5 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 11. VIDEO PRODUCTION
  // ─────────────────────────────────────────────
  {
    name: 'Video Production',
    description: 'Pre-production, filming, editing, and delivery of branded video content.',
    phases: [
      {
        name: 'Pre-Production',
        sort_order: 0,
        tasks: [
          { title: 'Video production kickoff call completed', description: 'Discuss video goals, style, length, intended platforms, audience, and key messages.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Creative brief & video questionnaire completed', description: 'Client provides context on brand tone, reference videos they like, key messages, and any specific do\'s and don\'ts.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 1 },
          { title: 'Brand assets uploaded', description: 'Upload logo files, brand colors, approved fonts, and any existing motion graphics or brand templates.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 2 },
          { title: 'Script / storyboard approved', description: 'Client reviews and approves the full script and visual storyboard before any production begins.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 14, sort_order: 3 },
          { title: 'Talent, location & shoot schedule confirmed', description: 'Client confirms on-screen talent (if client-supplied), filming location access, and shoot date/time.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 16, sort_order: 4 },
          { title: 'Props, wardrobe & product samples provided', description: 'Client delivers any physical items needed on set by the agreed drop-off deadline.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 18, sort_order: 5 },
        ],
      },
      {
        name: 'Production',
        sort_order: 1,
        tasks: [
          { title: 'Filming / recording completed', description: 'Internal: execute shoot per approved storyboard; capture all required footage and B-roll.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 0 },
          { title: 'Raw footage reviewed & selects confirmed', description: 'Internal: review all footage and select the best takes for editing.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 23, sort_order: 1 },
          { title: 'Music / voiceover assets licensed or recorded', description: 'Internal: source licensed music tracks and record or commission any required voiceover.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 24, sort_order: 2 },
        ],
      },
      {
        name: 'Post-Production & Delivery',
        sort_order: 2,
        tasks: [
          { title: 'First cut delivered for review', description: 'Client receives the initial edited cut with rough color, music, and graphics for feedback.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 32, sort_order: 0 },
          { title: 'Round 1 revisions completed', description: 'Internal: implement all client feedback from the first cut review.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 36, sort_order: 1 },
          { title: 'Final cut approved', description: 'Client gives written approval on the final video before color grade and master export.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 39, sort_order: 2 },
          { title: 'Final files exported & delivered', description: 'Internal: deliver master file plus platform-optimized cuts (YouTube, Instagram, LinkedIn) via agreed transfer method.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 42, sort_order: 3 },
          { title: 'File delivery confirmed by client', description: 'Client confirms receipt and successful download of all delivered video files.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 44, sort_order: 4 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 12. REPUTATION MANAGEMENT
  // ─────────────────────────────────────────────
  {
    name: 'Reputation Management',
    description: 'Review generation, monitoring setup, and response strategy for online reputation.',
    phases: [
      {
        name: 'Audit & Setup',
        sort_order: 0,
        tasks: [
          { title: 'Reputation management kickoff call completed', description: 'Review current review profile, identify key platforms, and agree on goals (volume, rating, response time).', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Google Business Profile access granted', description: 'Client adds agency as manager to the Google Business Profile.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 4, sort_order: 1 },
          { title: 'Review platform access granted', description: 'Client provides access to all relevant review platforms (Yelp, Trustpilot, G2, Facebook, etc.).', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 2 },
          { title: 'Current review audit completed', description: 'Internal: audit all existing reviews across platforms — volume, rating distribution, sentiment, and key themes.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 3 },
          { title: 'Review response tone & policy approved', description: 'Client reviews and approves the response template library and escalation policy for negative reviews.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 10, sort_order: 4 },
          { title: 'Review generation strategy approved', description: 'Client approves the outreach approach for requesting reviews from satisfied customers (email, SMS, in-person).', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 12, sort_order: 5 },
        ],
      },
      {
        name: 'Implementation',
        sort_order: 1,
        tasks: [
          { title: 'Review monitoring tool configured', description: 'Internal: set up review monitoring across all platforms with real-time alerts for new reviews.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 14, sort_order: 0 },
          { title: 'Review request automation set up', description: 'Internal: configure automated review request emails or SMS triggered by completed purchases/services.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 16, sort_order: 1 },
          { title: 'Customer email list / CRM access provided', description: 'Client exports recent customer list for initial outreach campaign.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 14, sort_order: 2 },
          { title: 'Initial outreach campaign sent', description: 'Internal: send review request to existing customer base to build initial review volume.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 18, sort_order: 3 },
          { title: 'Google Business Profile optimized', description: 'Internal: update GBP with correct hours, photos, services, and attributes to support discoverability.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 18, sort_order: 4 },
        ],
      },
      {
        name: 'Ongoing & Reporting',
        sort_order: 2,
        tasks: [
          { title: 'All backlog reviews responded to', description: 'Internal: write and post responses to all existing unanswered reviews.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 0 },
          { title: 'Escalation process confirmed', description: 'Client confirms who to contact internally when a negative review requires intervention.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 14, sort_order: 1 },
          { title: 'Month 1 reputation report delivered', description: 'Share review volume, rating change, sentiment summary, and response rate with client.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 2 },
          { title: 'Reporting cadence confirmed', description: 'Client confirms preferred reporting frequency and dashboard access.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 3 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 13. LOCAL SEO & GOOGLE BUSINESS PROFILE
  // ─────────────────────────────────────────────
  {
    name: 'Local SEO',
    description: 'Google Business Profile optimization, local citations, and local search visibility.',
    phases: [
      {
        name: 'Audit & Access',
        sort_order: 0,
        tasks: [
          { title: 'Local SEO kickoff call completed', description: 'Review service areas, target keywords, current GBP status, and competitive landscape.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Google Business Profile access granted', description: 'Client adds agency as manager to the Google Business Profile.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 4, sort_order: 1 },
          { title: 'Google Search Console access granted', description: 'Client grants access to GSC for tracking local search impressions and clicks.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 4, sort_order: 2 },
          { title: 'Business information document completed', description: 'Client provides NAP (Name, Address, Phone), business hours, service categories, service areas, and description.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 3 },
          { title: 'Business photos & video uploaded', description: 'Client provides high-quality interior, exterior, team, and product/service photos.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 4 },
          { title: 'Local SEO audit & strategy report approved', description: 'Client reviews findings (GBP health, citation consistency, local rankings) and approves the action plan.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 12, sort_order: 5 },
        ],
      },
      {
        name: 'Optimization',
        sort_order: 1,
        tasks: [
          { title: 'Google Business Profile fully optimized', description: 'Internal: update all GBP fields — categories, services, hours, attributes, Q&A, posts, and photos.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 16, sort_order: 0 },
          { title: 'Local citations audit & cleanup completed', description: 'Internal: audit and correct NAP inconsistencies across top directories (Yelp, YP, Bing Places, Apple Maps, etc.).', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 1 },
          { title: 'Priority citations built or claimed', description: 'Internal: create/claim listings on all major directories and niche-relevant platforms.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 28, sort_order: 2 },
          { title: 'Website local SEO on-page optimization completed', description: 'Internal: optimize title tags, meta descriptions, schema markup, and location pages for local keywords.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 30, sort_order: 3 },
          { title: 'Local content / landing page approved', description: 'Client reviews and approves any new location or service-area landing pages before publishing.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 33, sort_order: 4 },
        ],
      },
      {
        name: 'Monitoring & Reporting',
        sort_order: 2,
        tasks: [
          { title: 'Local rank tracking configured', description: 'Internal: set up local keyword tracking with geo-specific rankings for target service areas.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 35, sort_order: 0 },
          { title: 'GBP posting schedule activated', description: 'Internal: begin weekly GBP posts per the approved content calendar.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 36, sort_order: 1 },
          { title: 'Month 1 local SEO report delivered', description: 'Share GBP impressions, map pack rankings, local keyword movements, and citation health with client.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 2 },
          { title: 'Reporting cadence confirmed', description: 'Client confirms preferred reporting frequency and access to tracking dashboards.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 38, sort_order: 3 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 14. CONVERSION RATE OPTIMIZATION (CRO)
  // ─────────────────────────────────────────────
  {
    name: 'Conversion Rate Optimization (CRO)',
    description: 'Audit, hypothesis testing, and iterative improvements to increase website conversions.',
    phases: [
      {
        name: 'Audit & Research',
        sort_order: 0,
        tasks: [
          { title: 'CRO kickoff call completed', description: 'Define primary conversion goals, current conversion rate baseline, and pages to prioritize.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Google Analytics access granted', description: 'Client grants Editor access to GA4 for funnel and behavior analysis.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 4, sort_order: 1 },
          { title: 'Heatmap / session recording tool installed', description: 'Internal: install Hotjar, Microsoft Clarity, or equivalent on priority pages.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 2 },
          { title: 'CMS / website edit access granted', description: 'Client provides access to make page-level changes or run A/B tests.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 5, sort_order: 3 },
          { title: 'Quantitative data analysis completed', description: 'Internal: analyze GA4 funnels, drop-off points, traffic sources, device breakdown, and form abandonment.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 12, sort_order: 4 },
          { title: 'Qualitative research completed', description: 'Internal: review session recordings, heatmaps, and any available customer surveys or support tickets.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 16, sort_order: 5 },
          { title: 'CRO audit & test roadmap approved', description: 'Client reviews the prioritized list of conversion issues, hypotheses, and proposed A/B test roadmap.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 19, sort_order: 6 },
        ],
      },
      {
        name: 'Testing & Implementation',
        sort_order: 1,
        tasks: [
          { title: 'A/B testing tool configured', description: 'Internal: set up Google Optimize, VWO, or Optimizely with correct goals and traffic allocation.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 0 },
          { title: 'Test 1 variant designed & approved', description: 'Client reviews and approves the design and copy for the first A/B test variant.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 24, sort_order: 1 },
          { title: 'Test 1 launched', description: 'Internal: activate the first A/B test and confirm both variants are serving correctly.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 25, sort_order: 2 },
          { title: 'Test 1 results analyzed & winner implemented', description: 'Internal: evaluate statistical significance, document learnings, and implement the winning variant.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 46, sort_order: 3 },
          { title: 'Test 2 launched', description: 'Internal: run the second experiment in the approved test roadmap.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 48, sort_order: 4 },
        ],
      },
      {
        name: 'Reporting & Iteration',
        sort_order: 2,
        tasks: [
          { title: 'Month 1 CRO report delivered', description: 'Share test results, conversion rate changes, revenue impact estimate, and next recommended experiments.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 60, sort_order: 0 },
          { title: 'Next test cycle roadmap approved', description: 'Client reviews and approves the upcoming quarter\'s testing roadmap based on Month 1 learnings.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 63, sort_order: 1 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 15. PUBLIC RELATIONS (PR)
  // ─────────────────────────────────────────────
  {
    name: 'Public Relations (PR)',
    description: 'Media outreach, press release strategy, and earned coverage for brand awareness.',
    phases: [
      {
        name: 'Onboarding & Strategy',
        sort_order: 0,
        tasks: [
          { title: 'PR kickoff call completed', description: 'Discuss brand story, key messages, target media outlets, upcoming announcements, and press goals.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Company backgrounder & bio completed', description: 'Client provides a company fact sheet, founding story, leadership bios, and any existing press materials.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 1 },
          { title: 'Brand assets & headshots uploaded', description: 'Upload high-resolution logo, brand photography, and executive headshots for media use.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 2 },
          { title: 'Key messages & spokesperson brief approved', description: 'Client reviews and approves the core messaging document and designated spokesperson guidelines.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 12, sort_order: 3 },
          { title: 'PR strategy & media target list approved', description: 'Client approves the 90-day PR strategy, pitch angles, and priority media outlets and journalists.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 16, sort_order: 4 },
        ],
      },
      {
        name: 'Outreach & Pitching',
        sort_order: 1,
        tasks: [
          { title: 'Press release drafted & approved', description: 'Client reviews and approves the first press release before it is distributed.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 20, sort_order: 0 },
          { title: 'Media list built', description: 'Internal: compile targeted list of journalists, editors, and influencers covering relevant beats.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 18, sort_order: 1 },
          { title: 'Initial pitch outreach completed', description: 'Internal: send personalized pitches to priority media contacts.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 22, sort_order: 2 },
          { title: 'Press release distributed', description: 'Internal: distribute via wire service and direct journalist outreach.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 23, sort_order: 3 },
          { title: 'Media interview prep session completed', description: 'Coach client spokesperson on messaging, likely questions, and on-record/off-record protocols before any interviews.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 21, sort_order: 4 },
        ],
      },
      {
        name: 'Coverage & Reporting',
        sort_order: 2,
        tasks: [
          { title: 'Coverage monitoring set up', description: 'Internal: configure media monitoring alerts for brand mentions and coverage tracking.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 14, sort_order: 0 },
          { title: 'Secured coverage shared with client', description: 'Internal: share all published articles, interviews, and placements as they go live.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 1 },
          { title: 'Month 1 PR report delivered', description: 'Share coverage achieved (outlet name, DA, reach, sentiment), pitches sent, response rate, and next angles.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 45, sort_order: 2 },
          { title: 'Month 2 PR strategy confirmed', description: 'Client approves upcoming pitch angles and any planned announcements for the next month.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 47, sort_order: 3 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 16. MARKETING AUTOMATION
  // ─────────────────────────────────────────────
  {
    name: 'Marketing Automation',
    description: 'Lead nurture workflows, lifecycle sequences, and automation platform setup.',
    phases: [
      {
        name: 'Strategy & Platform Setup',
        sort_order: 0,
        tasks: [
          { title: 'Marketing automation kickoff call completed', description: 'Map the customer lifecycle, define lead stages, and agree on priority automation sequences to build.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 2, sort_order: 0 },
          { title: 'Automation platform access granted', description: 'Client adds agency as admin in HubSpot / ActiveCampaign / Marketo / Klaviyo or chosen platform.', is_client_task: true, requires_approval: false, is_asset_required: false, default_due_days: 4, sort_order: 1 },
          { title: 'CRM / contact data exported & reviewed', description: 'Client exports current contact database and identifies segment criteria for automation enrollment.', is_client_task: true, requires_approval: false, is_asset_required: true, default_due_days: 7, sort_order: 2 },
          { title: 'Sending domain authenticated', description: 'Internal: configure SPF, DKIM, and DMARC for all sending domains.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 7, sort_order: 3 },
          { title: 'Lead lifecycle & scoring model approved', description: 'Client reviews and approves lead stage definitions, scoring criteria, and MQL/SQL thresholds.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 12, sort_order: 4 },
          { title: 'Automation map & workflow plan approved', description: 'Client approves the visual workflow map showing all triggers, conditions, delays, and actions for each sequence.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 16, sort_order: 5 },
        ],
      },
      {
        name: 'Build & Testing',
        sort_order: 1,
        tasks: [
          { title: 'Email templates designed & approved', description: 'Client reviews and approves the master email template before automation sequences are built.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 20, sort_order: 0 },
          { title: 'Sequence 1 (lead nurture) built & tested', description: 'Internal: build, proof, and internally test the primary lead nurture workflow end-to-end.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 26, sort_order: 1 },
          { title: 'Sequence 2 (onboarding / welcome) built & tested', description: 'Internal: build and test the new customer or subscriber welcome sequence.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 30, sort_order: 2 },
          { title: 'Additional sequences built per approved plan', description: 'Internal: build all remaining agreed workflows (re-engagement, upsell, event follow-up, etc.).', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 36, sort_order: 3 },
          { title: 'Form / landing page lead capture configured', description: 'Internal: build or connect opt-in forms and landing pages to the correct automation triggers.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 32, sort_order: 4 },
          { title: 'Client test walkthrough completed', description: 'Walk client through each automation live, test enroll, and confirm all emails, delays, and branch logic are correct.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 38, sort_order: 5 },
        ],
      },
      {
        name: 'Launch & Reporting',
        sort_order: 2,
        tasks: [
          { title: 'Final launch approval given', description: 'Client provides written sign-off to activate all automations for live contacts.', is_client_task: true, requires_approval: true, is_asset_required: false, default_due_days: 40, sort_order: 0 },
          { title: 'Automations activated', description: 'Internal: turn on all approved workflows and verify enrollment is working correctly.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 41, sort_order: 1 },
          { title: 'Month 1 automation report delivered', description: 'Share enrollment numbers, open rates, click rates, conversion rates, and revenue attributed per sequence.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 72, sort_order: 2 },
          { title: 'Optimization recommendations delivered', description: 'Internal: present data-backed recommendations for subject line, send time, and workflow branch improvements.', is_client_task: false, requires_approval: false, is_asset_required: false, default_due_days: 75, sort_order: 3 },
        ],
      },
    ],
  },
]
