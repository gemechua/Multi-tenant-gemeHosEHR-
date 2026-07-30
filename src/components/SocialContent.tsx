import React, { useState } from 'react';
import { 
  Megaphone, Target, Share2, Compass, MessageSquare, Copy, Check, 
  Sparkles, Globe, HeartPulse, ShieldCheck, ChevronRight, Award, 
  HelpCircle, RefreshCw, Send, CheckCircle2, ArrowRight,
  Linkedin, Twitter, Facebook, Instagram, Youtube, Video, FileText,
  DollarSign, BarChart3, ShieldAlert, Plus, Edit3, Trash2, Filter, Layers, Zap
} from 'lucide-react';

type MainView = 'advertising' | 'organic' | 'calculator' | 'compliance';
type Step = 'setup' | 'results';

interface PostTemplate {
  id: string;
  channel: string;
  tone: string;
  content: string;
  hashtags: string;
  visualCue?: string;
  videoScript?: boolean;
}

interface AdApplication {
  id: string;
  platform: 'Meta (Facebook/IG)' | 'Google Search Ads' | 'Google Display Network' | 'LinkedIn Ads' | 'TikTok Health Ads' | 'Community Public Media';
  campaignName: string;
  objective: string;
  headline: string;
  primaryText: string;
  callToAction: string;
  targetAudience: string;
  dailyBudget: number;
  status: 'Approved & Active' | 'Under Review' | 'Draft' | 'Paused';
  updatedAt: string;
}

export default function SocialContent() {
  const [activeTab, setActiveTab] = useState<MainView>('advertising');

  // Organic Social States
  const [step, setStep] = useState<Step>('setup');
  const [goal, setGoal] = useState<string>('Onboard Patients & Residents');
  const [customGoal, setCustomGoal] = useState('');
  const [channels, setChannels] = useState<string[]>(['LinkedIn', 'Twitter/X', 'Facebook', 'Instagram', 'YouTube', 'TikTok']);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [posts, setPosts] = useState<PostTemplate[]>([]);

  // Advertising Applications States
  const [adApplications, setAdApplications] = useState<AdApplication[]>([
    {
      id: 'ad-001',
      platform: 'Meta (Facebook/IG)',
      campaignName: 'Regional Patient Digital Onboarding 2026',
      objective: 'Patient Pre-Registration',
      headline: 'Skip Hospital Wait Times – Pre-Register Online Today',
      primaryText: 'Access fast, 100% paperless patient admission at Hospital EHR. Secure, encrypted, and available in multiple regional languages.',
      callToAction: 'Register Now',
      targetAudience: 'Ages 18-65+, Regional 50km radius, Interest: Healthcare & Wellness',
      dailyBudget: 45,
      status: 'Approved & Active',
      updatedAt: '2026-07-27 08:30'
    },
    {
      id: 'ad-002',
      platform: 'Google Search Ads',
      campaignName: 'EHR Clinical Partner Recruitment',
      objective: 'Medical Staff Hiring',
      headline: 'Modern Digital Hospital EHR | Join Our Medical Team',
      primaryText: 'Work with cutting-edge offline-first EHR technology. Reduced charting fatigue, multi-lingual tools, and competitive packages.',
      callToAction: 'Apply Today',
      targetAudience: 'Keywords: "Doctor jobs", "Nursing careers", "Digital Hospital EHR", "Clinical vacancies"',
      dailyBudget: 60,
      status: 'Approved & Active',
      updatedAt: '2026-07-27 08:15'
    },
    {
      id: 'ad-003',
      platform: 'LinkedIn Ads',
      campaignName: 'Health Executive B2B Compliance Awareness',
      objective: 'B2B Health Partnerships',
      headline: 'High-Availability Offline EHR for Regional Health Networks',
      primaryText: 'Ensure 100% continuous clinical care during network blackouts. Discover our ISO-compliant, offline-synchronized EHR platform.',
      callToAction: 'Download Whitepaper',
      targetAudience: 'Job Titles: Chief Medical Officer, Healthcare Director, EHR Administrator',
      dailyBudget: 100,
      status: 'Under Review',
      updatedAt: '2026-07-27 07:45'
    }
  ]);

  // New Ad Form State
  const [showAdModal, setShowAdModal] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adPlatform, setAdPlatform] = useState<AdApplication['platform']>('Meta (Facebook/IG)');
  const [adCampaignName, setAdCampaignName] = useState('');
  const [adObjective, setAdObjective] = useState('Patient Admissions');
  const [adHeadline, setAdHeadline] = useState('');
  const [adPrimaryText, setAdPrimaryText] = useState('');
  const [adCTA, setAdCTA] = useState('Register Now');
  const [adTargetAudience, setAdTargetAudience] = useState('');
  const [adBudget, setAdBudget] = useState<number>(50);
  const [adStatus, setAdStatus] = useState<AdApplication['status']>('Draft');

  // Ad ROI Calculator State
  const [calcBudget, setCalcBudget] = useState<number>(500);
  const [calcCPC, setCalcCPC] = useState<number>(0.85);
  const [calcConvRate, setCalcConvRate] = useState<number>(4.5);

  const availableGoals = [
    { label: 'Onboard Patients & Residents', desc: 'Promote easy, secure digital health admissions.' },
    { label: 'Attract Medical Staff & Partners', desc: 'Highlight advanced, multi-lingual offline charting.' },
    { label: 'Demonstrate Security Compliance', desc: 'Build trust with strict data privacy protocols.' },
    { label: 'Feature High-Availability Offline Mode', desc: 'Assure uninterrupted service for millions of residents.' }
  ];

  const availableChannels = [
    { name: 'LinkedIn', desc: 'Great for B2B clinical partners, healthcare executives, and technical audits.' },
    { name: 'Twitter/X', desc: 'Ideal for tech updates, fast public announcements, and digital health news.' },
    { name: 'Facebook', desc: 'Perfect for patient community engagement, health updates, and local group sharing.' },
    { name: 'Instagram', desc: 'Ideal for high-impact visual slides, doctor spotlights, and clinic guides.' },
    { name: 'YouTube', desc: 'Excellent for detailed video walkthroughs, system tutorials, and patient trust stories.' },
    { name: 'TikTok', desc: 'Great for short educational healthcare videos, nursing tips, and interactive scripts.' },
    { name: 'Local News / WhatsApp Groups', desc: 'Best for direct resident outreach, clinic updates, and health bulletins.' },
    { name: 'Medical Forums', desc: 'For sharing professional whitepapers and peer EHR integrations.' }
  ];

  const getChannelIcon = (name: string) => {
    switch (name) {
      case 'LinkedIn':
        return <Linkedin className="text-[#0077B5] w-4 h-4" />;
      case 'Twitter/X':
        return <Twitter className="text-[#1DA1F2] w-4 h-4" />;
      case 'Facebook':
        return <Facebook className="text-[#1877F2] w-4 h-4" />;
      case 'Instagram':
        return <Instagram className="text-[#E1306C] w-4 h-4" />;
      case 'YouTube':
        return <Youtube className="text-[#FF0000] w-4 h-4" />;
      case 'TikTok':
        return <Video className="text-[#EE1D52] w-4 h-4" />;
      case 'Local News / WhatsApp Groups':
        return <MessageSquare className="text-[#25D366] w-4 h-4" />;
      case 'Medical Forums':
        return <FileText className="text-purple-600 w-4 h-4" />;
      default:
        return <Share2 className="text-gray-500 w-4 h-4" />;
    }
  };

  const handleToggleChannel = (channelName: string) => {
    if (channels.includes(channelName)) {
      setChannels(channels.filter(c => c !== channelName));
    } else {
      setChannels([...channels, channelName]);
    }
  };

  const handleGetStarted = () => {
    setGenerating(true);
    setTimeout(() => {
      const activeGoal = customGoal.trim() || goal;
      const generatedPosts: PostTemplate[] = [];

      channels.forEach((chan, idx) => {
        let text = '';
        let hashtags = '';
        let tone = 'Professional & Informative';
        let visualCue = '';
        let videoScript = false;

        const goalLower = (activeGoal || '').toLowerCase();
        const isPatients = goalLower.includes('patient') || goalLower.includes('onboard');
        const isStaff = goalLower.includes('staff') || goalLower.includes('partner') || goalLower.includes('medical');
        const isSecurity = goalLower.includes('security') || goalLower.includes('compliance') || goalLower.includes('privacy');
        const isOffline = goalLower.includes('offline') || goalLower.includes('high-availability');

        if (chan === 'LinkedIn') {
          tone = 'Professional';
          if (isPatients) {
            text = `🏥 We are thrilled to introduce our paperless patient admissions at ehr.generalhospital.org! Engineered for maximum digital integration, our system ensures seamless clinical care for regional residents.\n\nFrom secure admissions to cloud-synchronized record keeping, we are redefining modern medical workflows.`;
          } else if (isStaff) {
            text = `👩‍⚕️ Clinicians & Health Tech Partners: Experience the future of medicine at ehr.generalhospital.org. Our platform features multi-lingual charting, rapid pharmacy diagnostics, and an interface that cuts charting times by 35%.\n\nWe are actively hiring medical staff!`;
          } else if (isSecurity) {
            text = `🔒 Patient privacy is fundamental. That's why ehr.generalhospital.org runs on advanced role-based access controls and robust encryption architectures, complying with strict health security audits.`;
          } else if (isOffline) {
            text = `⚡ Medical operations should never rely solely on unstable networks. At Hospital EHR, we've deployed an advanced offline-first synchronization engine to ensure continuous care even during blackouts.`;
          } else {
            text = `🏥 Officially upgraded our operations at ehr.generalhospital.org! Our goal: ${activeGoal}.\n\nDesigned for zero-downtime offline stability and paperless clinical workflows.`;
          }
          hashtags = '#DigitalHealth #EHR #HealthcareInnovation #MedTech #PaperlessHospital';
        } else if (chan === 'Twitter/X') {
          tone = 'Engaging & Direct';
          text = `Meet the next generation of healthcare: ehr.generalhospital.org! 🚀\n\n✅ 100% Paperless check-ins\n✅ Streamlined clinical registration\n✅ High-availability offline charting\n\nTry it today!`;
          hashtags = '#DigitalHealth #MedTech #EHR';
        } else if (chan === 'Facebook') {
          tone = 'Warm & Informative';
          text = `🏥 **Exciting News for Our Community!** 🏥\n\nWe've upgraded our portal at ehr.generalhospital.org to make your clinic check-ins faster, safer, and 100% paperless!\n\n⚡ Fast Admissions | 🛡️ Bank-Grade Security | 🌐 Multilingual Support\n\nVisit ehr.generalhospital.org today!`;
          hashtags = '#CommunityHealth #DigitalEHR #PatientCare';
        } else if (chan === 'Instagram') {
          tone = 'Visual & Informative';
          visualCue = 'Carousel Post (Slide 1: Clean check-in screen "No more clipboards." Slide 2: Security badges list. Slide 3: Simple registration steps)';
          text = `Clipboard fatigue is real! 📋❌ That's why we’ve upgraded our portal to let you complete your clinic check-ins right from your phone. Fast, secure, and 100% digital.\n\n👉 Click the link in our bio: ehr.generalhospital.org`;
          hashtags = '#EHRUpgrade #DigitalHealth #GeneralHospital';
        } else if (chan === 'YouTube') {
          tone = 'Production Outline';
          videoScript = true;
          visualCue = 'High definition screen recording demonstrating pre-registration in under 2 minutes.';
          text = `**PROPOSED TITLE**: How to Check In Online at Hospital EHR (Step-by-Step Guide)\n\n**VIDEO OUTLINE**:\n⏱️ 0:00 - Introduction\n⏱️ 0:45 - Live Screen Walkthrough\n⏱️ 1:30 - Pre-filling medical background\n⏱️ 2:15 - Security overview\n\n**DESCRIPTION**: Skip waiting room paperwork! Pre-register at ehr.generalhospital.org`;
          hashtags = '#EHRWalkthrough #MedTechVideo';
        } else if (chan === 'TikTok') {
          tone = 'Snappy Video Script';
          videoScript = true;
          visualCue = 'POV split-screen: Left = Old clipboard form, Right = Sleek phone tap check-in.';
          text = `**SCENE 1**: "POV: Checking in at a clinic in 2010 vs TODAY 🚀"\n**SCENE 2**: "No clipboards. No wait. Pre-register online at ehr.generalhospital.org in 60 seconds!"`;
          hashtags = '#TikTokDoctor #HospitalHacks #EHRUpgrade';
        } else {
          tone = 'Direct Announcement';
          text = `📢 Community Update: Fast, secure, paperless patient registration is live at ehr.generalhospital.org!`;
          hashtags = '#HospitalUpdate #CommunityCare';
        }

        generatedPosts.push({
          id: `${chan.toLowerCase().replace(/[^a-z]/g, '')}-${idx}`,
          channel: chan,
          tone,
          content: text,
          hashtags,
          visualCue,
          videoScript
        });
      });

      setPosts(generatedPosts);
      setGenerating(false);
      setStep('results');
    }, 1000);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Advertising Application CRUD Operations
  const handleSaveAd = () => {
    if (!adCampaignName.trim() || !adHeadline.trim()) return;

    if (editingAdId) {
      // Update existing
      setAdApplications(adApplications.map(ad => ad.id === editingAdId ? {
        ...ad,
        platform: adPlatform,
        campaignName: adCampaignName,
        objective: adObjective,
        headline: adHeadline,
        primaryText: adPrimaryText,
        callToAction: adCTA,
        targetAudience: adTargetAudience,
        dailyBudget: adBudget,
        status: adStatus,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      } : ad));
    } else {
      // Create new
      const newAd: AdApplication = {
        id: `ad-${Date.now()}`,
        platform: adPlatform,
        campaignName: adCampaignName,
        objective: adObjective,
        headline: adHeadline,
        primaryText: adPrimaryText,
        callToAction: adCTA,
        targetAudience: adTargetAudience || 'General Regional Demographic 18-65+',
        dailyBudget: adBudget,
        status: adStatus,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setAdApplications([newAd, ...adApplications]);
    }

    resetAdForm();
  };

  const resetAdForm = () => {
    setShowAdModal(false);
    setEditingAdId(null);
    setAdCampaignName('');
    setAdHeadline('');
    setAdPrimaryText('');
    setAdTargetAudience('');
    setAdBudget(50);
    setAdStatus('Draft');
  };

  const handleEditAd = (ad: AdApplication) => {
    setEditingAdId(ad.id);
    setAdPlatform(ad.platform);
    setAdCampaignName(ad.campaignName);
    setAdObjective(ad.objective);
    setAdHeadline(ad.headline);
    setAdPrimaryText(ad.primaryText);
    setAdCTA(ad.callToAction);
    setAdTargetAudience(ad.targetAudience);
    setAdBudget(ad.dailyBudget);
    setAdStatus(ad.status);
    setShowAdModal(true);
  };

  const handleDeleteAd = (id: string) => {
    setAdApplications(adApplications.filter(a => a.id !== id));
  };

  const handleQuickTemplateSelect = (type: 'meta' | 'google' | 'linkedin') => {
    setShowAdModal(true);
    setEditingAdId(null);
    if (type === 'meta') {
      setAdPlatform('Meta (Facebook/IG)');
      setAdCampaignName('Meta Sponsored Patient Pre-Registration');
      setAdObjective('Patient Onboarding');
      setAdHeadline('Fast & Safe Paperless Clinic Admissions');
      setAdPrimaryText('Skip the queue! Complete your medical pre-registration securely on your phone at ehr.generalhospital.org.');
      setAdCTA('Register Now');
      setAdTargetAudience('Location: 30km Hospital Radius | Age: 18-65 | Interest: Family Health');
      setAdBudget(40);
    } else if (type === 'google') {
      setAdPlatform('Google Search Ads');
      setAdCampaignName('Google High-Intent Emergency & Pre-Reg Search');
      setAdObjective('Search Traffic');
      setAdHeadline('General Hospital EHR Portal | Online Pre-Checkin');
      setAdPrimaryText('Official EHR Portal. 100% Encrypted & Offline Resilient. Pre-register your appointment online now.');
      setAdCTA('Visit Site');
      setAdTargetAudience('Keywords: "Hospital appointment", "Online clinic checkin", "Hospital registration"');
      setAdBudget(75);
    } else if (type === 'linkedin') {
      setAdPlatform('LinkedIn Ads');
      setAdCampaignName('LinkedIn Clinical B2B EHR Partnership');
      setAdObjective('B2B Partnerships');
      setAdHeadline('Offline-Resilient EHR for Regional Clinics');
      setAdPrimaryText('Eliminate charting downtime with our multi-lingual, offline-synchronized EHR platform. Partner with us.');
      setAdCTA('Learn More');
      setAdTargetAudience('Job Titles: Hospital Administrator, Chief Medical Officer, Clinical Director');
      setAdBudget(120);
    }
  };

  // ROI Calculations
  const estimatedClicks = Math.floor(calcBudget / (calcCPC || 1));
  const estimatedConversions = Math.floor(estimatedClicks * (calcConvRate / 100));
  const costPerAcquisition = estimatedConversions > 0 ? (calcBudget / estimatedConversions).toFixed(2) : '0';

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Top Banner & Hub Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Megaphone size={14} className="text-indigo-400 animate-pulse" />
              <span>Advertising & Promotion Operations Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Advertising Applications & Social Campaigns
            </h1>
            <p className="text-sm text-indigo-200/80 max-w-2xl">
              Write, update, configure, and evaluate paid advertising applications and organic promotional campaigns for Hospital EHR across Meta Ads, Google Ads, LinkedIn, TikTok, and public media networks.
            </p>
          </div>

          <button
            onClick={() => handleQuickTemplateSelect('meta')}
            className="shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New Ad Application</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab('advertising')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'advertising'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Target size={14} />
            <span>Advertising Applications ({adApplications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('organic')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'organic'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Share2 size={14} />
            <span>Organic Social Posts</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <BarChart3 size={14} />
            <span>Ad Budget & ROI Estimator</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'compliance'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Ad Policy & Health Compliance</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ADVERTISING APPLICATIONS MANAGER */}
      {activeTab === 'advertising' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Active Advertising Applications
                <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {adApplications.length} Campaigns
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage, update, and deploy advertising copy across official advertising platforms.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuickTemplateSelect('meta')}
                className="px-3 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                + Meta Preset
              </button>
              <button
                onClick={() => handleQuickTemplateSelect('google')}
                className="px-3 py-2 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                + Google Preset
              </button>
              <button
                onClick={() => handleQuickTemplateSelect('linkedin')}
                className="px-3 py-2 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors cursor-pointer"
              >
                + LinkedIn Preset
              </button>
            </div>
          </div>

          {/* Ad Applications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adApplications.map((ad) => {
              const isMeta = ad.platform.includes('Meta');
              const isGoogle = ad.platform.includes('Google');
              const isLinkedIn = ad.platform.includes('LinkedIn');

              return (
                <div 
                  key={ad.id} 
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group"
                >
                  <div className="space-y-3">
                    {/* Platform & Status */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                        isMeta 
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                          : isGoogle 
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : isLinkedIn
                          ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                          : 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                      }`}>
                        {ad.platform}
                      </span>

                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        ad.status === 'Approved & Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : ad.status === 'Under Review'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ad.status === 'Approved & Active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`} />
                        {ad.status}
                      </span>
                    </div>

                    {/* Title & Headline */}
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                        {ad.campaignName}
                      </h3>
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1 line-clamp-2">
                        "{ad.headline}"
                      </div>
                    </div>

                    {/* Ad Copy preview */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-3">
                      {ad.primaryText}
                    </div>

                    {/* Metadata & Targeting */}
                    <div className="space-y-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <div className="flex items-center justify-between">
                        <span>Target Audience:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">{ad.targetAudience}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>CTA Button:</span>
                        <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-bold">{ad.callToAction}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Daily Budget:</span>
                        <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">${ad.dailyBudget}/day</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Updated: {ad.updatedAt}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditAd(ad)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors cursor-pointer"
                        title="Edit Application"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                        title="Delete Application"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIC SOCIAL CONTENT GENERATOR */}
      {activeTab === 'organic' && (
        <div className="space-y-8 animate-fadeIn">
          {step === 'setup' ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold font-mono">1</span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Define Goal</h3>
                    <p className="text-xs text-slate-400">Select an objective for your organic campaign.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableGoals.map((g) => {
                    const isSelected = goal === g.label && !customGoal;
                    return (
                      <button
                        key={g.label}
                        onClick={() => {
                          setGoal(g.label);
                          setCustomGoal('');
                        }}
                        className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                          isSelected 
                            ? 'border-purple-600 bg-purple-50/20 shadow-xs dark:bg-purple-950/20' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">{g.label}</span>
                          {isSelected && (
                            <span className="bg-purple-600 text-white rounded-full p-0.5 shrink-0">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-1">{g.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold font-mono">2</span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Select Channels</h3>
                    <p className="text-xs text-slate-400">Pick where your audience resides.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableChannels.map((c) => {
                    const isSelected = channels.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        onClick={() => handleToggleChannel(c.name)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="pt-0.5">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(c.name)}
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">{c.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">{c.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleGetStarted}
                disabled={generating || channels.length === 0}
                className="w-full bg-purple-950 hover:bg-purple-900 text-white font-bold text-sm py-4 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {generating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                <span>Generate Ready-To-Post Social Content</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Generated Organic Posts</h3>
                <button
                  onClick={() => setStep('setup')}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Configure Again
                </button>
              </div>

              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(post.channel)}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{post.channel}</span>
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                          {post.tone}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleCopy(post.id, `${post.content}\n\n${post.hashtags}`)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === post.id ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedId === post.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <textarea 
                      value={post.content}
                      onChange={(e) => {
                        setPosts(posts.map(p => p.id === post.id ? { ...p, content: e.target.value } : p));
                      }}
                      rows={5}
                      className="w-full text-xs sm:text-sm text-slate-800 dark:text-slate-200 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950"
                    />

                    <div className="text-xs text-purple-600 dark:text-purple-400 font-mono font-semibold">
                      {post.hashtags}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AD BUDGET & ROI CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="text-emerald-500" />
              Advertising ROI & Budget Estimator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculate projected patient pre-registrations and cost per acquisition based on ad spend metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Monthly Ad Budget ($)</label>
              <input 
                type="number"
                value={calcBudget}
                onChange={(e) => setCalcBudget(Number(e.target.value))}
                className="w-full p-3 text-sm font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Est. Cost Per Click (CPC $)</label>
              <input 
                type="number"
                step="0.05"
                value={calcCPC}
                onChange={(e) => setCalcCPC(Number(e.target.value))}
                className="w-full p-3 text-sm font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Est. Conversion Rate (%)</label>
              <input 
                type="number"
                step="0.1"
                value={calcConvRate}
                onChange={(e) => setCalcConvRate(Number(e.target.value))}
                className="w-full p-3 text-sm font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900">
              <div className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Est. Ad Clicks</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{estimatedClicks.toLocaleString()}</div>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Est. Patient Admissions</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">{estimatedConversions.toLocaleString()}</div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900">
              <div className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Cost Per Acquisition (CPA)</div>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono mt-1">${costPerAcquisition}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AD POLICY & HEALTH COMPLIANCE */}
      {activeTab === 'compliance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="text-amber-500" />
              Healthcare Advertising Compliance Policy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mandatory rules for advertising medical software, EHR portals, and hospital admissions on Google, Meta, and LinkedIn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Google Healthcare Ads Certification</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Google requires registered hospital domains to verify official healthcare provider credentials before running search ads on prescription or diagnostic terms.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Meta Personal Health & Retargeting</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Meta strictly forbids retargeting users based on specific medical conditions. Use broad regional demographics and emphasize general paperless check-in speed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AD EDITING MODAL */}
      {showAdModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingAdId ? 'Update Advertising Application' : 'Write New Advertising Application'}
              </h3>
              <button onClick={resetAdForm} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ad Network Platform</label>
                <select 
                  value={adPlatform}
                  onChange={(e) => setAdPlatform(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold"
                >
                  <option value="Meta (Facebook/IG)">Meta (Facebook & Instagram Ads)</option>
                  <option value="Google Search Ads">Google Search Ads</option>
                  <option value="Google Display Network">Google Display Network</option>
                  <option value="LinkedIn Ads">LinkedIn Ads (B2B / Careers)</option>
                  <option value="TikTok Health Ads">TikTok Health Video Ads</option>
                  <option value="Community Public Media">Community Public Media / Press</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Campaign Name</label>
                <input 
                  type="text"
                  placeholder="e.g., Regional Patient Pre-Reg Meta Campaign"
                  value={adCampaignName}
                  onChange={(e) => setAdCampaignName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Headline (Short & Impactful)</label>
                <input 
                  type="text"
                  placeholder="e.g., Skip Hospital Wait Times – Pre-Register Online Today"
                  value={adHeadline}
                  onChange={(e) => setAdHeadline(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Ad Copy / Description</label>
                <textarea 
                  rows={4}
                  placeholder="Write the full ad text describing the platform features, paperless intake, or multi-lingual support..."
                  value={adPrimaryText}
                  onChange={(e) => setAdPrimaryText(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Call to Action (CTA)</label>
                  <input 
                    type="text"
                    value={adCTA}
                    onChange={(e) => setAdCTA(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Budget ($)</label>
                  <input 
                    type="number"
                    value={adBudget}
                    onChange={(e) => setAdBudget(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Audience & Keywords</label>
                <input 
                  type="text"
                  placeholder="e.g., Location 50km radius | Age 18-65 | Keywords: 'Hospital precheck'"
                  value={adTargetAudience}
                  onChange={(e) => setAdTargetAudience(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Application Status</label>
                <select 
                  value={adStatus}
                  onChange={(e) => setAdStatus(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold"
                >
                  <option value="Draft">Draft</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved & Active">Approved & Active</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={resetAdForm}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAd}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
              >
                Save Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
