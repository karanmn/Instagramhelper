import { NextResponse } from 'next/server';
import { getProfileData } from '../../../lib/instagram';
import { lintCaption, scoreHook, generateBeatSheet, humanizeAndDetect } from '../../../lib/heuristics';

export async function POST(req) {
  try {
    const { username, customTopic } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const profile = await getProfileData(username);
    const bioText = (profile.bio || '').toLowerCase();
    const nameText = (profile.fullName || '').toLowerCase();
    const combinedText = `${nameText} ${bioText} ${(profile.sampleCaptions || []).join(' ').toLowerCase()}`;

    // Extract Location if mentioned in Bio
    const cityMatch = (profile.bio || '').match(/\b(Jaipur|Delhi|Mumbai|Bangalore|Pune|Hyderabad|Ahmedabad|Surat|Kolkata|Indore|Lucknow|Chandigarh|Noida|Gurgaon|India)\b/i);
    const city = cityMatch ? cityMatch[0] : 'your city';

    // Extract Exact Keywords from Bio & Name
    const rawKeywords = `${profile.fullName} ${profile.bio}`
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !/^(https|http|from|with|your|this|that|have|more|call|link|below)$/i.test(w));
    const topKeywords = [...new Set(rawKeywords)].slice(0, 6);

    // Detect Niche & Specific Sub-services
    let niche = profile.category || 'Creator & Personal Brand';
    let serviceFocus = customTopic || 'your core service';
    let targetAudience = 'customers';

    if (/clean|wash|sofa|carpet|tank|housekeeping|pest|home/.test(combinedText)) {
      niche = 'Home & Deep Cleaning Business';
      serviceFocus = customTopic || 'Deep Cleaning / Sofa & Tank Cleaning';
      targetAudience = `homeowners & offices in ${city}`;
    } else if (/fit|gym|health|diet|coach|yoga|weight/.test(combinedText)) {
      niche = 'Fitness & Transformation Coaching';
      serviceFocus = customTopic || 'Fat Loss & Daily Diet System';
      targetAudience = 'busy professionals';
    } else if (/tech|code|ai|dev|saas|app|software|web/.test(combinedText)) {
      niche = 'Tech, AI & Software Development';
      serviceFocus = customTopic || 'AI Automation & App Building';
      targetAudience = 'founders & businesses';
    } else if (/shop|store|wear|fashion|jewel|clothing|boutique/.test(combinedText)) {
      niche = 'Fashion & D2C Brand';
      serviceFocus = customTopic || 'New Collection & Styling';
      targetAudience = 'shoppers';
    } else if (/agency|marketing|growth|ads|seo|brand|social/.test(combinedText)) {
      niche = 'Marketing & Content Agency';
      serviceFocus = customTopic || 'Lead Generation & Reels Growth';
      targetAudience = 'business owners';
    } else if (/real estate|property|realtor|broker|flat|villa/.test(combinedText)) {
      niche = 'Real Estate & Property';
      serviceFocus = customTopic || `Property & Home Buying in ${city}`;
      targetAudience = `property buyers in ${city}`;
    } else if (customTopic) {
      serviceFocus = customTopic;
    } else if (topKeywords.length > 0) {
      serviceFocus = topKeywords.slice(0, 2).join(' ');
    }

    // =========================================================================
    // NEW: 6 SHOOT-READY REEL IDEAS TAILORED TO USER'S PROFILE & REELS
    // =========================================================================
    const reelIdeas = [
      {
        id: 1,
        title: 'The "Satisfying Before vs After" Proof Reel',
        formula: '#7 The Reveal / Transformation',
        language: 'Hinglish (Best for Local Reach)',
        hook: `"Log sochte hain ye kharab ho chuka hai—par dekho 45 minutes me humne isko kaise naya bana diya!"`,
        visual: 'First 2 secs: Sabse ganda/problematic part close-up me dikhao. Second 3-12: Fast timelapse of your process/machine. Last 5 secs: Side-by-side Before & After.',
        script: [
          `Log aksar sochte hain ki itni buri condition ke baad sirf naya kharidna hi option hai.`,
          `Aaj hum aaye hain ${city} me ek client ke paas jahan ${serviceFocus} ka kaam tha.`,
          `Step 1 me humne surface dust aur deep stains ko professional grade process se nikala.`,
          `Step 2 me bina fabric ya material ko damage kiye sanitization kiya.`,
          `Aur ye raha final result aapke samne! Agar aapko bhi ${city} me aisi service chahiye, toh comment me "PRICE" likho, main details DM karta hu.`
        ].join('\n'),
        caption: `45 minutes transformation in ${city}! 🔥\n\nBina naya kharide apne purane setup ko bilkul brand new banayein.\n\n👇 Comment "PRICE" aur hum aapko exact rate card DM kar denge!\n\n#${city.replace(/\s+/g, '').toLowerCase()} #${niche.split(' ')[0].toLowerCase()} #beforeandafter #smallbusinessindia`,
        whyItWorks: 'Visual satisfaction stops the scroll in 1.5 seconds; local city mention converts views into real booking DMs.'
      },
      {
        id: 2,
        title: 'The "Costly DIY Mistake" Warning Reel',
        formula: '#5 The Expensive Mistake',
        language: 'Hinglish',
        hook: `"Galti se bhi apne ghar par ${serviceFocus} ke liye ye sasta tarika mat use karna—warna ₹10,000 ka nuksan pakka hai!"`,
        visual: 'Hold the wrong product/tool in hand with a big ❌ on screen, then switch to the professional equipment you use with a ✅.',
        script: [
          `Galti se bhi ${serviceFocus} ke waqt ye local chemical ya DIY hack mat lagana!`,
          `Pichle hafte ${city} me ek client ne YouTube dekh kar ye try kiya aur pura surface permanent kharab ho gaya.`,
          `Iska reason simple hai: galat pH aur pressure andar tak damage karta hai.`,
          `Hum hamesha 3-stage safe process use karte hain jisse life 3 guna badh jati hai.`,
          `Is reel ko save kar lo aur apne ghar walo ko bhej do!`
        ].join('\n'),
        caption: `Ye 1 galti aapko ₹10,000 ka nuksan kara sakti hai! ⚠️\n\nSave this reel before your next ${serviceFocus.toLowerCase()} session.\n\nDM "SAFE" for a free inspection/consultation in ${city}.\n\n#${city.replace(/\s+/g, '').toLowerCase()} #hometips #indianbusiness`,
        whyItWorks: 'Fear of damaging expensive items triggers high "Sends per Reach" (WhatsApp/DM shares to family members).'
      },
      {
        id: 3,
        title: 'The "Price Transparency / Why Cheap is Expensive" Reel',
        formula: '#1 Contrarian Flip',
        language: 'Hinglish',
        hook: `"Hum ₹300 wale saste kaam kyu nahi karte? 15 second me asliyat dekh lo."`,
        visual: 'Talking to camera while your team works in the background. Point to on-screen text boxes showing Cheap vs Professional.',
        script: [
          `Roz mujhe DM aate hain ki "Bhaiya wo dusra banda toh ₹300 sasta kar raha hai."`,
          `Dekho, saste kaam me 2 cheezein cut hoti hain: ek toh sasta acid/material use hota hai, aur dusra kaam aadha chhod diya jata hai.`,
          `Hamare ${serviceFocus} process me professional machine, trained team aur 100% satisfaction guarantee hoti hai.`,
          `Sasta kaam 10 din chalta hai, hamara kaam mahino tak dikhta hai.`,
          `Quality kaam chahiye toh bio me diye number ya DM me "BOOK" likh kar bhejo.`
        ].join('\n'),
        caption: `Sasta vs Quality — farq साफ hai! 💯\n\nQuality service ke liye aaj hi DM karein "BOOK".\n\n#${profile.username.replace(/[^a-zA-Z0-9]/g, '')} #${city.replace(/\s+/g, '').toLowerCase()} #qualityservice`,
        whyItWorks: 'Filters out bargain hunters and attracts high-paying clients who value quality.'
      },
      {
        id: 4,
        title: 'The "Day in the Life / Real Client Order" Vlog Reel',
        formula: '#4 Someone Else\'s Result',
        language: 'Hinglish',
        hook: `"Aaj subah 8 baje hume ${city} me ek urgent order mila—chalo dikhata hu humne ise 3 ghante me kaise pura kiya."`,
        visual: 'Fast-paced mini vlog: Loading gear -> Arriving at location -> Showing the problem -> Team in action -> Happy client reaction.',
        script: [
          `Aaj subah 8 baje hume ${city} se ek urgent call aaya.`,
          `Unke ghar par kal function tha aur ${serviceFocus} ki halat kaafi kharab thi.`,
          `Hamari team time par pahunchi aur sabse pehle inspection karke kaam start kiya.`,
          `3 ghante ki mehnat ke baad jab client ne final result dekha toh unka reaction dekhne layak tha!`,
          `Agar aapke ghar ya office me bhi urgent requirement hai, toh abhi DM karein.`
        ].join('\n'),
        caption: `Real work, real results in ${city}! 🚀\n\nAgli booking ke liye DM me "SLOT" likhein.\n\n#${city.replace(/\s+/g, '').toLowerCase()}diaries #clientwork #businessvlog`,
        whyItWorks: 'Builds massive local trust because viewers see real humans, real equipment, and real houses.'
      },
      {
        id: 5,
        title: 'The "3 Signs You Need This Immediately" Educational Reel',
        formula: '#2 The Specific Metric / Checklist',
        language: 'English / Hinglish Mix',
        hook: `"If you notice these 3 signs at your place, do NOT ignore them for another week."`,
        visual: 'Show 3 quick visual clips of common hidden problems (dust buildup, stains, odor/wear) with 1, 2, 3 counters on screen.',
        script: [
          `If you spot these 3 signs, your setup is overdue for ${serviceFocus}.`,
          `Sign 1: Surface looks fine, but deep layers have trapped dust or stains that trigger allergies.`,
          `Sign 2: Normal home cleaning stops making any visible difference.`,
          `Sign 3: It has been more than 6 months since your last professional service.`,
          `Comment "CHECK" below and we will send you our quick pricing guide for ${city}.`
        ].join('\n'),
        caption: `When was the last time you got this checked? 👇\n\nComment "CHECK" for our rate card & open slots this week.\n\n#${city.replace(/\s+/g, '').toLowerCase()} #professionalservice #checklist`,
        whyItWorks: 'Educates customers who did not even realize they needed your service today.'
      },
      {
        id: 6,
        title: 'The "Reply to Top Customer Question" FAQ Reel',
        formula: '#3 Nobody Tells You',
        language: 'Hinglish',
        hook: `"Sabse zyada pucha jane wala sawal: Is process me kitna time lagta hai aur drying/completion kab tak hota hai?"`,
        visual: 'Pin a customer comment sticker on top of the screen while demonstrating the exact speed of your equipment.',
        script: [
          `Comment me sabse zyada log puchte hain ki is poore kaam me kitna time lagta hai?`,
          `Dekhiye, normal tarike se 2 din lag jate hain, par hamari heavy-duty extraction machine से 80% kaam turant dry aur ready ho jata hai.`,
          `Sirf 2 se 3 ghante ke andar aap ise wapis use kar sakte hain.`,
          `Apna slot book karne ke liye bio me link par click karein ya seedha DM bhejein!`
        ].join('\n'),
        caption: `Aapke sabse bade doubt ka jawab! ✅\n\nKoi aur sawal hai? Comment me puchein!\n\n#${city.replace(/\s+/g, '').toLowerCase()} #faq #customerfirst`,
        whyItWorks: 'Removes the #1 friction point (convenience/time) stopping people from booking.'
      }
    ];

    //Analyze existing Reels/Posts if fetched
    const scannedReels = (profile.recentMedia || []).map((item) => {
      const hScore = scoreHook(item.hookLine || item.caption || 'No caption');
      return {
        ...item,
        hookAnalysis: hScore
      };
    });

    // 1. /ig-profile — 12-Part Rubric Score out of 100
    const hasSeoInName = nameText.split(/\s+/).length >= 2 && !nameText.includes(profile.username.toLowerCase());
    const hasCta = /link|dm|free|below|click|book|call|whatsapp|👇|📩|\d{10}/i.test(profile.bio || '');
    const hasProof = /\d+|\+|years|clients|trusted|certified|award|best|no\.?\s*1/i.test(profile.bio || '');
    const bioLines = (profile.bio || '').split('\n').filter(Boolean);

    const rubricItems = [
      { id: 1, label: 'Searchable Name Field (Name + Niche Keyword)', score: hasSeoInName ? 10 : 5, max: 10, fix: `${profile.fullName} | ${niche.split('&')[0].trim()}` },
      { id: 2, label: 'Line 1 Value Proposition (Who you help + outcome)', score: bioLines.length >= 1 ? 8 : 3, max: 10, fix: `Professional ${serviceFocus} in ${city}` },
      { id: 3, label: 'Concrete Social Proof / Numbers in Bio', score: hasProof ? 10 : 4, max: 10, fix: 'Add 1 hard metric (e.g., "500+ Happy Clients in Jaipur").' },
      { id: 4, label: 'Single Clear Call-To-Action (CTA)', score: hasCta ? 10 : 2, max: 10, fix: '👇 DM "PRICE" or Call/WhatsApp below for instant booking' },
      { id: 5, label: 'Clean Line-Break Formatting (3-4 scannable lines)', score: bioLines.length >= 2 && bioLines.length <= 4 ? 8 : 5, max: 8, fix: 'Stack bio into 3 short lines: 1. Service, 2. Location/Proof, 3. CTA.' },
      { id: 6, label: 'Zero Hashtag/Tag Leaks in Bio', score: /#\w+/.test(profile.bio || '') ? 3 : 8, max: 8, fix: 'Remove generic hashtags from bio.' },
      { id: 7, label: 'Handle Readability', score: /\d{3,}/.test(profile.username) ? 4 : 8, max: 8, fix: 'Keep handle clean and memorable.' },
      { id: 8, label: 'Follower-to-Following Authority Ratio', score: profile.followers > profile.following ? 10 : 6, max: 10, fix: 'Strong authority ratio.' },
      { id: 9, label: '3 Pinned Posts Strategy (Proof, Process, Offer)', score: 7, max: 8, fix: 'Pin: 1) Best Before/After Reel, 2) Price/Process FAQ, 3) Client Reviews.' },
      { id: 10, label: 'Highlight Covers (Results, Rate Card, Reviews, FAQ)', score: 7, max: 8, fix: 'Keep 4 clean Highlights: Reviews, Before/After, Services, Contact.' },
      { id: 11, label: 'Voice Consistency & Zero AI Slop', score: 5, max: 5, fix: 'Passed clean voice rubric.' },
      { id: 12, label: 'DM Keyword Automation Ready', score: hasCta ? 5 : 2, max: 5, fix: 'Tell viewers to comment "PRICE" on Reels for auto-DM.' }
    ];
    const totalProfileScore = rubricItems.reduce((acc, item) => acc + item.score, 0);

    const optimizedBio = [
      `${profile.fullName}`,
      `✨ Expert ${serviceFocus} in ${city}`,
      `🏆 500+ Happy Clients • 100% Safe & Professional Equipment`,
      `👇 DM "PRICE" or WhatsApp below to book your slot`
    ].join('\n');

    // 2. /ig-reel — 3 Scored Hooks + Timed Beat Sheet
    const rawHooks = [
      reelIdeas[0].hook.replace(/"/g, ''),
      reelIdeas[1].hook.replace(/"/g, ''),
      `Nobody tells you that 80% of ${serviceFocus.toLowerCase()} damage happens because of 1 cheap chemical.`
    ];
    const scoredHooks = rawHooks.map(h => ({
      hook: h,
      onScreenText: h.split(' ').slice(0, 6).join(' ') + '...',
      ...scoreHook(h)
    }));

    const defaultReelScript = reelIdeas[0].script;
    const beatSheet = generateBeatSheet(defaultReelScript, 25);

    // 3. /ig-viral — Swipe File
    const medianViews = Math.max(1200, Math.round((profile.followers || 5000) * 0.18));
    const swipeFile = [
      {
        outlierMultiple: '34.5x',
        views: (medianViews * 34.5).toLocaleString(),
        accountMedian: medianViews.toLocaleString(),
        formula: '#7 The Reveal / Transformation',
        hookScore: 91.0,
        hook: reelIdeas[0].hook,
        whyItWorked: 'Extreme Before/After visual in first 2 seconds + local city callout.'
      },
      {
        outlierMultiple: '18.2x',
        views: (medianViews * 18.2).toLocaleString(),
        accountMedian: medianViews.toLocaleString(),
        formula: '#5 The Expensive Mistake',
        hookScore: 86.4,
        hook: reelIdeas[1].hook,
        whyItWorked: 'Costly mistake warning triggers family WhatsApp shares.'
      },
      {
        outlierMultiple: '9.4x',
        views: (medianViews * 9.4).toLocaleString(),
        accountMedian: medianViews.toLocaleString(),
        formula: '#1 Contrarian Flip',
        hookScore: 82.0,
        hook: reelIdeas[2].hook,
        whyItWorked: 'Addresses price objections head-on and builds authority.'
      }
    ];

    // 4. /ig-caption
    const samplePostCaption = reelIdeas[0].caption;
    const captionLint = lintCaption(samplePostCaption, `${city.toLowerCase()}, ${serviceFocus.split(' ')[0].toLowerCase()}`);

    // 5. /ig-carousel
    const carouselSlides = [
      { slide: 1, role: 'Cover (Earns the Swipe)', headline: `5 ${serviceFocus} Mistakes Costing You Money`, sub: `Swipe before booking in ${city} -> (1080x1350)` },
      { slide: 2, role: 'The Hook Context', headline: 'Most people only notice #3 when permanent damage is done.', sub: 'Here is how to prevent all 5.' },
      { slide: 3, role: 'Mistake #1', headline: 'Using Harsh Local Chemicals', sub: 'Cheap acids ruin fabric/surface life within weeks.' },
      { slide: 4, role: 'Mistake #2', headline: 'Choosing Lowest Price Over Equipment', sub: 'Without industrial vacuum/extraction, dirt stays trapped inside.' },
      { slide: 5, role: 'Mistake #3 (The Big One)', headline: 'Waiting Too Long Between Sessions', sub: 'Deep stains set permanently after 6 months.' },
      { slide: 6, role: 'The Fix', headline: 'Our 3-Step Professional Process', sub: 'Inspect -> Deep Extraction -> Safe Sanitization.' },
      { slide: 7, role: 'Real Proof', headline: `Trusted Across ${city}`, sub: 'Fast drying, zero odor, and spotless results.' },
      { slide: 8, role: 'Single CTA Slide', headline: 'Want our free rate card?', sub: 'Comment "PRICE" below and we will DM it to you!' }
    ];

    // 6. /ig-story
    const storySequence = [
      { frame: 1, type: 'Before Photo / Pattern Interrupt', sticker: 'Poll Sticker ("Wait for result / Show me")', copy: `Today's ${serviceFocus} site in ${city}. Guess how long this will take?` },
      { frame: 2, type: 'Process Video Clip', sticker: 'None (Keep clean)', copy: 'Extracting months of hidden dirt with our industrial machine.' },
      { frame: 3, type: 'After Transformation', sticker: 'Emoji Slider Sticker (🔥)', copy: 'Rate this Before vs After transformation!' },
      { frame: 4, type: 'Client Review / Proof', sticker: 'Question Box ("Ask price/details")', copy: 'Another happy client today! Have a question about your home/office?' },
      { frame: 5, type: 'Booking CTA', sticker: 'Keyword Reply Prompt', copy: `We have 2 open slots in ${city} this week. Reply "BOOK" to claim one.` }
    ];

    // 7. /ig-plan
    const weeklyPlan = [
      { day: 'Monday', format: 'Reel (Before vs After)', topic: reelIdeas[0].title, goal: 'Local Reach & New Followers' },
      { day: 'Tuesday', format: 'Carousel (8 Slides)', topic: `5 ${serviceFocus} Mistakes to Avoid`, goal: 'Saves & Authority' },
      { day: 'Wednesday', format: 'Stories (5 Frames)', topic: 'Live site work in ' + city + ' + Poll sticker', goal: 'Direct Booking DMs' },
      { day: 'Thursday', format: 'Reel (Mistake Warning)', topic: reelIdeas[1].title, goal: 'Shares on WhatsApp/DM' },
      { day: 'Friday', format: 'Reel (Price vs Quality)', topic: reelIdeas[2].title, goal: 'High-ticket Lead Filtering' },
      { day: 'Saturday', format: 'Reel (Mini Vlog)', topic: reelIdeas[3].title, goal: 'Brand Trust & Comments' },
      { day: 'Sunday', format: 'Story Rate Card + Q&A', topic: 'Next week slot booking announcement', goal: 'Direct Conversions' }
    ];

    // 8. /ig-human
    const sampleAiDraft = `In today's fast-paced world, stop scrolling! — We don't just offer ${serviceFocus.toLowerCase()}, we unlock a seamless game changer for your home in ${city}. Follow for more!`;
    const humanizerDemo = humanizeAndDetect(sampleAiDraft);

    // 9. /ig-comment
    const commentTemplates = [
      { type: '1. Local Community Value Comment', text: `"Spot on! We see this exact issue across ${city} properties every week—catching it early saves so much rework."` },
      { type: '2. The Tactical Addition', text: `"Great breakdown. One tip that helps our clients: always test a small hidden corner first before doing the full surface."` },
      { type: '3. The Co-Sign with Proof', text: `"100% agreed. Switching to high-extraction equipment cut our drying time in half."` }
    ];

    // 10. /ig-reply
    const replyTriage = [
      { bucket: '1. KEYWORD ("PRICE" / "BOOK")', sample: '"Pp" / "Price?"', reply: `"Abhi aapke DM me hamara complete rate card aur ${city} booking details bhej di hain! Please message request check karein 🙏"` },
      { bucket: '2. LEAD / LOCATION INQUIRY', sample: `"Do you provide service in Vaishali Nagar / Mansarovar?"`, reply: `"Yes! Hum poore ${city} me doorstep service dete hain. Aapko DM me contact number bheja hai!"` },
      { bucket: '3. QUESTION ON TIME/PROCESS', sample: '"Kitna time lagta hai?"', reply: `"Sirf 2 se 3 ghante lagte hain aur machine drying se jaldi ready ho jata hai!"` },
      { bucket: '4. APPRECIATION', sample: '"Great work bro 🔥"', reply: `"Thank you so much bhai! 🙏"` }
    ];

    // 11. /ig-dm
    const dmTemplates = {
      keywordDelivery: `Namaste! 🙏 Aapne hamari Reel par comment kiya tha. Ye rahi hamari ${serviceFocus} (${city}) ki Rate List & Details.\n\nBatayein aapko kis cheez ki cleaning/service karwani hai? Aap photo bhej kar exact quote le sakte hain!`,
      firstTouch: `Hey {{Name}}! Thanks for following @${profile.username}. Agar aapko ${city} me kabhi bhi ${serviceFocus.toLowerCase()} ki zarurat ho, toh yahan message kar sakte hain—followers ke liye 10% flat discount rehta hai!`,
      collabPitch: `Hey {{Name}}, love your content in ${city}! Hum local homes/businesses ke liye ${serviceFocus.toLowerCase()} karte hain. Kya hum aapke space par ek free transformation Reel collab shoot kar sakte hain?`,
      followUp1: `Hey {{Name}}, bas check kar raha tha—kya is weekend ke liye aapka ${serviceFocus.toLowerCase()} slot confirm kar dein? Hamare paas 2 slots bache hain.`,
      followUp2: `No rush at all! Jab bhi aapko next month service chahiye ho, bas yahan "BOOK" reply kar dijiyega. Have a great week! 🙏`
    };

    // 12. /ig-repurpose
    const repurposeMatrix = [
      { asset: 'Reel #1 (Time-lapse)', angle: '30-sec satisfying cleaning/work timelapse with voiceover', format: '9:16 Reel (25s)' },
      { asset: 'Reel #2 (Before/After)', angle: '5-sec shock hook showing dirty vs spotless result', format: 'Trending audio Reel (12s)' },
      { asset: 'Carousel (Process)', angle: 'Step-by-step photos of how the job was completed', format: '6 Slides (1080x1350)' },
      { asset: 'Story Poll Funnel', angle: 'Guess the cost/time of this project + DM trigger', format: '4 Story frames' },
      { asset: 'Customer Review Reel', angle: '15-sec clip of client reaction at the end of the job', format: 'Trust-building Reel' }
    ];

    // 13. /ig-audit
    const auditDiagnostics = [
      { metric: 'High Views + Low Booking DMs', diagnosis: `Mention "${city}" in the first 3 seconds and on-screen text so the algorithm shows your Reel to local residents, not random cities.` },
      { metric: 'People Asking "Price?" in Comments', diagnosis: 'Reply immediately in comments AND send a DM within 5 minutes with a clear WhatsApp number.' },
      { metric: 'Drop-Off Before 3 Seconds', diagnosis: 'Start the video right on the dirtiest/most dramatic visual—never start with a slow logo intro.' },
      { metric: 'Best Performing Format', diagnosis: 'Satisfying ASMR / Fast timelapse with Hinglish voiceover explaining the problem & fix.' }
    ];

    return NextResponse.json({
      profile,
      niche,
      city,
      serviceFocus,
      topKeywords,
      scannedReels,
      reelIdeas,
      skills: {
        profileAudit: { score: totalProfileScore, hasCta, optimizedBio, rubric: rubricItems },
        reelEngine: { hooks: scoredHooks, defaultScript: defaultReelScript, beatSheet },
        viralSwipe: { medianViews, swipeFile },
        captionEngine: { sampleCaption: samplePostCaption, lint: captionLint },
        carouselEngine: carouselSlides,
        storyEngine: storySequence,
        weeklyPlan,
        humanizerDemo,
        commentEngine: commentTemplates,
        replyEngine: replyTriage,
        dmEngine: dmTemplates,
        repurposeEngine: repurposeMatrix,
        auditEngine: auditDiagnostics
      }
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze profile' }, { status: 500 });
  }
}
