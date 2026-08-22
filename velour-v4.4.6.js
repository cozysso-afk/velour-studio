'use strict';

/* =========================================================
   VELOUR STORY ENGINE V4.4.6 — POST-UNLOCK RELATIONSHIP PACE PATCH
   Loaded AFTER velour-v3.5.js.

   Goals
   - preserve V2 library/draft and V3.5 helper controls
   - unify duplicate world/relationship/pacing UI into 5 compact accordions
   - separate world / job / relationship / trajectory axes
   - add military + historical + creator profession depth
   - restore religion/clergy/monastic roles with denomination-aware rules
   - expand current romance taxonomy: campus, academy, martial arts, occult, hunter/guide, game/VR, regression
   - add inhuman/supernatural, dimension travel, reincarnation, game-possession, real history, eastern/western period fantasy, reverse-harem/disguise/pregnancy/family-conflict opt-ins
   - exclude child-mediated reunion tropes and same-sex genre presets by product choice
   - add FWB / sex-friend relationship options
   - hard-canon + ordered storyline lock
   - long-run memory via compact model metadata
   - intimacy pacing/cooldown/diversity controls
   - progressive desire-expression gate: internal attraction → awareness → flirting → explicit dialogue → adult scene
   - professional-boundary and late possessiveness safeguards
   - post-unlock pace transition so slow burn does not become permanent stalling
   - language controls: dirty talk, profanity, explicit body terms
   - never allow minors; intimate scenes require consenting adults
   ========================================================= */
(() => {
  'use strict';
  if (window.__VELOUR_V44_INSTALLED__) return;
  window.__VELOUR_V44_INSTALLED__ = true;

  const CFG_KEY = 'VELOUR_STORY_ENGINE_V44';
  const OLD_CFG_KEYS = ['VELOUR_STORY_ENGINE_V43','VELOUR_STORY_ENGINE_V42','VELOUR_STORY_ENGINE_V41','VELOUR_STORY_ENGINE_V40'];
  const LIB_KEY = 'VELOUR_STORY_LIBRARY_V2';
  const DRAFT_KEY = 'VELOUR_STORY_DRAFT_V2';
  const V33_KEY = 'VELOUR_STORY_ENGINE_V33';
  const META_RE = /\n?\[\[VELOUR_V4_META\]\]([\s\S]*?)\[\[\/VELOUR_V4_META\]\]\s*/g;
  const MAX_TIMELINE = 80;
  const MAX_THREADS = 24;
  const MAX_SCENES = 12;

  const WORLDS = [
    ['modern_general','현대 · 일반'],
    ['office','오피스 · 기업'],
    ['chaebol','재계 · 재벌가'],
    ['military','군대 · 군인'],
    ['law_investigation','법조 · 수사 · 보안'],
    ['medical','의료 · 병원'],
    ['media','방송 · 언론 · 미디어'],
    ['entertainment','연예계 · 엔터테인먼트'],
    ['creator','작가 · 웹툰 · 크리에이터'],
    ['sports','스포츠 · 피트니스'],
    ['arts','예술 · 공연 · 디자인'],
    ['travel_hospitality','항공 · 여행 · 호텔'],
    ['food_service','식음료 · 서비스'],
    ['education_research','교육 · 연구'],
    ['tech_game','IT · 게임 · 테크'],
    ['finance_realestate','금융 · 투자 · 부동산'],
    ['dark_underworld','조직 · 암흑가 · 느와르'],
    ['historical_korea','동양 시대극 · 궁중/사대부'],
    ['historical_west','서양 시대극 · 귀족/사교계'],
    ['historical_real','실존 역사물 · 시대/지역 고증'],
    ['eastern_fantasy','동양풍 가상시대 · 동양 로판'],
    ['western_fantasy','서양풍 가상시대 · 서양 로판'],
    ['campus','캠퍼스 · 대학/대학원 (성인)'],
    ['adult_academy','아카데미 · 성인 교육기관/마법학교'],
    ['religious','종교 공동체 · 성직/수행'],
    ['martial_arts','무협 · 강호'],
    ['myth_supernatural','신화 · 초월적 존재'],
    ['hunter_guide','헌터 · 가이드버스'],
    ['horror_occult','공포 · 괴담 · 오컬트'],
    ['game_virtual','게임 · VR · 가상세계'],
    ['game_possession','게임빙의 · 게임세계 진입'],
    ['dimension_travel','차원이동 · 이세계'],
    ['reincarnation','전생 · 환생'],
    ['time_reincarnation','회귀 · 타임슬립 · 빙의/영혼체인지'],
    ['inhuman','인외 · 수인 · 뱀파이어 · 악마'],
    ['omegaverse_mf','오메가버스 · 성인 남녀'],
    ['fantasy','판타지 · 로판'],
    ['sf','SF · 근미래']
  ];

  const RELATIONSHIPS = [
    ['strangers','완전 초면'], ['acquaintance','지인'], ['friends','친구'], ['best_friends','절친'],
    ['childhood','소꿉친구'], ['friend_of_friend','친구의 친구'], ['neighbors','이웃'], ['roommates','룸메이트'],
    ['cohabit','동거인'], ['coworkers','직장 동료'], ['senior_junior','선후배'], ['boss_sub','상사 × 부하'],
    ['rivals','라이벌'], ['enemies','앙숙'], ['ex_flirt','구썸'], ['ex_lovers','전 연인'], ['first_love','첫사랑'],
    ['reunion','헤어진 뒤 재회'], ['dating','현재 연인'], ['longtime_lovers','오래된 연인'], ['married','부부'], ['blind_date','소개/맞선 상대'],
    ['arranged_partner','정략결혼/약혼 상대'], ['marriage_first','선결혼 후 관계 형성'],
    ['religious_guidance','성직자/수행자 × 성인 신도'], ['religious_lay','성직자/수행자 × 일반 성인'],
    ['contract','계약 관계'], ['fake_dating','가짜 연애'], ['secret_relation','비밀 관계'],
    ['one_night','원나잇 직후'], ['fwb','섹파 / FWB'], ['fwb_repeat','원나잇 후 반복적으로 만나는 사이'],
    ['physical_only','육체적 관계만 합의한 사이'], ['undefined','관계 정의 없이 만나는 사이'],
    ['fwb_one_sided','섹파인데 한쪽만 감정이 생긴 상태']
  ];

  const TRAJECTORIES = [
    ['organic','자연스럽게 진행'], ['slow_romance','감정 먼저 → 신체적 관계 나중'],
    ['physical_to_emotion','신체적 관계 먼저 → 감정 발전'], ['friends_to_lovers','친구 → 연인'],
    ['childhood_to_lovers','소꿉친구 → 연인'], ['enemies_to_lovers','앙숙/라이벌 → 연인'],
    ['reunion_rebuild','재회 → 신뢰 재구축'], ['fwb_keep','섹파 관계 유지'], ['fwb_to_lovers','섹파 → 연인'],
    ['one_sided_to_mutual','한쪽만 먼저 빠짐 → 쌍방'], ['secret_love','비밀 연애'], ['long_distance','장거리 관계'],
    ['arranged_to_love','정략/선결혼 → 진짜 연애'], ['love_hate_to_love','애증 → 관계 재정립'],
    ['contract_to_real','계약/가짜 관계 → 진짜 감정']
  ];

  const DYNAMICS = [
    ['possessive','집착 · 소유욕'], ['taboo','금기 · 배덕감'], ['age_gap','나이 차이 · 연상연하'],
    ['secret_office','비밀 사내연애'], ['power_tension','갑을/권력 긴장'], ['jealousy','질투 촉발'],
    ['mutual_pining','쌍방 짝사랑'], ['one_sided','한쪽이 먼저 감정'], ['protective','보호/경호 관계'],
    ['teacher_adult','성인 과외/교육 관계'],
    ['celibacy_vow','독신·금욕 서약과 감정 충돌 · 해당 성직/수행자만'],
    ['religious_boundary','성직자/수행자 × 성인 신도 · 직업윤리/공동체 긴장'],
    ['faith_difference','서로 다른 신앙/가치관의 충돌'], ['community_reputation','종교 공동체·평판 압박'],
    ['triangle','삼각관계'], ['class_gap','신분/계층 차이'], ['love_hate','애증'], ['fated','운명적 사랑'],
    ['misunderstanding','오해'], ['revenge','복수'], ['memory_loss','기억상실'],
    ['time_loop','회귀/타임슬립'], ['body_swap','빙의/영혼체인지'], ['supernatural','초능력/초월적 존재'],
    ['dimension_cross','차원이동 · 이세계 적응'], ['past_life','전생 기억 · 환생 인연'],
    ['game_possession_dynamic','게임빙의 · 게임 규칙'], ['nonhuman_romance','인외/초월적 존재와의 관계'],
    ['omega_rules','오메가버스 규칙 · 성인 남녀'], ['reverse_harem','역하렘 · 한 여주 × 복수의 성인 남주 후보'],
    ['identity_disguise','남장/신분위장 · 정체 발각'], ['pregnancy_change','임신/속도위반으로 관계 변화 · 선택 시에만'],
    ['family_inlaw','시가/가족 갈등 · 선택 시에만'],
    ['forced_proximity','강제적 근접 생활'], ['identity_secret','정체/이중생활 비밀']
  ];

  const OCCUPATIONS = {
    '기업·재계': ['대기업 회장','재벌 2세/3세','그룹 후계자','대표이사/CEO','임원','전략기획 임원','스타트업 창업자','브랜드 대표','호텔 경영자','건설사 대표','비서','수행비서','임원비서','팀장','회사원','해외지사 직원'],
    '금융·투자·부동산': ['투자회사 대표','벤처캐피털리스트','사모펀드 운용역','펀드매니저','애널리스트','증권사 직원','트레이더','은행원','자산관리사','회계사','세무사','부동산 개발업자','건축주','공인중개사'],
    '법조·수사·보안': ['검사','형사전문 검사','판사','변호사','대형로펌 변호사','형사전문 변호사','이혼전문 변호사','경찰','강력계 형사','수사관','프로파일러','정보기관 요원','사설탐정','경호원','재벌가 전담 경호원','보안전문가'],
    '군인': ['육군 장교','해군 장교','공군 장교','해병대 장교','부사관','직업군인','특수부대 군인','군의관','군 법무관','군 조종사','전투기 조종사','해외파병 군인','전역 예정 군인','장기복무 군인'],
    '의료·보건': ['의사','인턴','레지던트','외과의','응급의학과 전문의','정형외과 전문의','정신건강의학과 전문의','산부인과 전문의','피부과 전문의','성형외과 전문의','치과의사','한의사','수의사','간호사','응급구조사','물리치료사','작업치료사','임상심리사','약사'],
    '작가·출판·웹툰': ['문학소설 작가','로맨스소설 작가','성인 로맨스 소설 작가','웹소설 작가','로맨스 웹소설 작가','19금 웹소설 작가','야설/에로틱 픽션 작가','로판 작가','시나리오 작가','드라마 작가','웹툰 스토리 작가','웹툰 작화가','성인 웹툰 스토리 작가','19금 웹툰 작화가','일러스트레이터','출판 편집자','웹소설 PD','웹툰 PD','콘텐츠 편집자','번역가'],
    '연예·방송·음악': ['배우','아이돌','가수','싱어송라이터','모델','배우 매니저','아이돌 매니저','연예기획사 대표','음악 프로듀서','작곡가','작사가','영화감독','드라마 PD','예능 PD','방송작가','아나운서','기자','뉴스 앵커','성우','스타일리스트','메이크업 아티스트'],
    '유튜브·디지털 크리에이터': ['유튜버','브이로거','뷰티 유튜버','게임 유튜버','여행 유튜버','운동 유튜버','먹방 크리에이터','테크 유튜버','경제/재테크 유튜버','ASMR 크리에이터','스트리머','BJ','인플루언서','SNS 크리에이터','팟캐스터','영상 편집자','콘텐츠 기획자'],
    '예술·디자인·공연': ['피아니스트','바이올리니스트','첼리스트','지휘자','화가','조각가','사진작가','패션사진가','무용수','발레리노/발레리나','안무가','타투이스트','패션디자이너','인테리어 디자이너','그래픽 디자이너','주얼리 디자이너'],
    '스포츠·피트니스': ['수영선수','축구선수','야구선수','농구선수','배구선수','골프선수','격투기 선수','복싱선수','태권도 선수','피겨선수','양궁선수','국가대표 선수','은퇴선수','감독/코치','PT 트레이너','필라테스 강사','요가 강사','스포츠 에이전트','팀닥터'],
    '항공·여행·호텔': ['항공기 조종사','승무원','항공사 직원','호텔리어','호텔 총지배인','컨시어지','여행작가','여행사 기획자','가이드','리조트 운영자'],
    '식음료·서비스': ['셰프','파티시에','바리스타','바텐더','소믈리에','레스토랑 오너','베이커리 오너','플로리스트','헤어디자이너','퍼스널쇼퍼'],
    '교육·연구': ['성인 대학생','대학원생','조교','대학 교수','연구원','박사과정 연구자','학원강사','교사','외국어 강사','통역사','번역가','사서','큐레이터'],
    '종교·성직·수행': ['가톨릭 신부','가톨릭 수도사','가톨릭 수녀','개신교 목사','개신교 전도사','성공회 사제','불교 승려/스님','불교 비구니','군종장교/군종사제','종교학자','신학교 교수','선교사','성인 신도/평신도'],
    '무속·오컬트·영성': ['무당/무속인','타로 리더','점성술사','영매','오컬트 연구자','퇴마사(픽션)','괴담 작가','심령 현상 조사자'],
    '공공·외교·정치': ['외교관','대사관 직원','국제기구 직원','공무원','정책연구원','국회의원 보좌관','정치인','선거 캠프 전략가'],
    'IT·게임·테크': ['소프트웨어 개발자','게임 개발자','AI 연구원','데이터 사이언티스트','보안 엔지니어','프로덕트 매니저','UX/UI 디자이너','스타트업 CTO','프로게이머','게임 스트리머','로봇공학자'],
    '현장·기술·기타': ['건축가','현장소장','자동차 정비사','레이서','소방관','구급대원','목수','공방 운영자','프리랜서','취업준비생','무직','건물주'],
    '암흑가·느와르': ['조직 보스','조직 간부','해결사','사채업자','카지노 사업가','클럽 오너','뒷세계 브로커','재벌가 문제 해결사'],
    '동양 시대극': ['왕','세자','대군','중전','세자빈','후궁','궁녀','상궁','호위무사','장군','무관','문관','선비','의원','역관','상단주','양반가 자제','몰락 양반','평민'],
    '서양 시대극·로판': ['황제/왕','황태자/왕세자','공작','후작','백작','기사단장','기사','근위대장','궁정의','외교관','귀족 영애','시녀','상단주','마탑주','마법사'],
    '인외·초월적 존재': ['뱀파이어','수인','늑대인간','악마','천사','신/여신','반신','요괴','구미호','용족','정령','불사자','마족','인간형 인외 존재'],
    '판타지·SF': ['헌터','길드장','서포터/힐러','성기사','마법사','연금술사','용병','우주선 조종사','우주군 장교','사이버보안 요원','안드로이드 연구원']
  };

  const RELIGIOUS_RULES = [
    ['auto','AUTO · 직업/종파 현실 기준으로 처리'],
    ['celibate','독신·금욕 서약 있음'],
    ['marriage_ok','결혼/성생활 허용 · 자동 파계 아님'],
    ['community_only','금욕보다 공동체·직업윤리/평판 갈등 중심'],
    ['custom','HARD CANON 직접 지정']
  ];

  const HISTORICAL_STYLES = [
    ['readable','현대 가독성 사극 · 시대어는 절제'],
    ['classic_formal','고전 로맨스 · 격식 있는 대사/고전 어휘'],
    ['palace_lyrical','궁중 서정극 · 예법/계절/의복/향/공간 묘사 강화'],
    ['witty_classic','해학적 고전극 · 능청/의성어·의태어/옛말맛']
  ];

  const FACE_SHAPES = [
    ['oval','계란형'], ['round','둥근형'], ['heart','하트형'], ['long','긴형'], ['sharp','선이 뚜렷한형'], ['soft_v','부드러운 V라인']
  ];
  const EYE_STYLES = [
    ['soft','부드러운 눈매'], ['cat','고양이상 눈매'], ['fox','여우상 눈매'], ['round','동그란 눈매'], ['sharp','날카로운 눈매'], ['droopy','처진 강아지상 눈매']
  ];
  const NOSE_STYLES = [
    ['balanced','자연스러운 코'], ['high','콧대가 또렷한 코'], ['small','작고 단정한 코'], ['straight','반듯한 직선 코']
  ];
  const LIP_STYLES = [
    ['soft','자연스럽고 부드러운 입술'], ['full','도톰한 입술'], ['defined','선명한 입술선'], ['thin','얇고 단정한 입술']
  ];
  const FEMALE_HAIR_LENGTHS = [
    ['bob','단발'], ['mid','중단발'], ['long','긴머리'], ['very_long','아주 긴머리']
  ];
  const MALE_HAIR_LENGTHS = [
    ['short','짧은 머리'], ['medium','중간 길이'], ['long','긴머리']
  ];
  const FEMALE_HAIR_STYLES = [
    ['straight','생머리'], ['wave','내추럴 웨이브'], ['c_curl','C컬/단정한 스타일'], ['s_curl','S컬/볼륨감 있는 스타일'], ['updo','묶은 머리/업스타일'], ['layered','레이어드 스타일']
  ];
  const MALE_HAIR_STYLES = [
    ['neat','단정한 스타일'], ['soft_part','부드러운 가르마'], ['slick','뒤로 넘긴 스타일'], ['messy','자연스러운 헝클 스타일'], ['wolf','울프/레이어드 스타일']
  ];
  const HAIR_COLORS = [
    ['black','블랙'], ['dark_brown','다크브라운'], ['brown','브라운'], ['ash_brown','애쉬브라운'], ['blonde','블론드'], ['silver','실버/회색'], ['red_brown','레드브라운'], ['fantasy','특수 염색/판타지 색']
  ];
  const SKIN_TONES = [
    ['bright','밝고 깨끗한 톤'], ['neutral','중간/뉴트럴 톤'], ['warm','따뜻한 톤'], ['tan','건강한 태닝 톤'], ['cool','차분한 쿨 톤'], ['custom','사용자 설정 우선']
  ];
  const FEMALE_IMPRESSIONS = [
    ['soft','부드럽고 단정함'], ['cool','도회적·차분함'], ['fox','여우상·도발적'], ['innocent','청순·맑은 분위기'], ['elegant','우아하고 성숙한 분위기']
  ];
  const MALE_IMPRESSIONS = [
    ['clean','단정하고 선명한 인상'], ['cold','냉정하고 날카로운 인상'], ['soft','조신하고 부드러운 인상'], ['gentle','다정하고 안정적인 인상'], ['wild','거칠고 퇴폐적인 인상']
  ];

  const PACING = [
    ['ultra','ULTRA SLOW · 본격 진전 12~20화 이후'],
    ['slow','SLOW · 본격 진전 8~12화 이후'],
    ['balanced','BALANCED · 본격 진전 5~8화 이후'],
    ['fast','FAST · 본격 진전 3~5화 이후'],
    ['custom','CUSTOM · 아래 시작 화 직접 지정']
  ];

  const INTIMACY_PATTERNS = [
    ['face','마주보는 구도'], ['rear','뒤에서 이루어지는 구도'], ['side','옆으로 나란한 구도'],
    ['seated','앉은 자세 중심'], ['standing','선 자세 중심'], ['oral_manual','구강/손 중심'],
    ['bed','침대 중심'], ['sofa_chair','소파/의자 중심'], ['shower','욕실/샤워 공간'], ['floor_wall','벽/바닥 등 다른 공간']
  ];

  const DEFAULT = {
    world:'modern_general', relationship:'childhood', trajectory:'organic', dynamics:[], historicalStyle:'readable', periodNote:'',
    occCategoryA:'작가·출판·웹툰', occupationA:'웹소설 작가', occCategoryB:'기업·재계', occupationB:'회사원',
    socialA:'ordinary', socialB:'ordinary', militaryStatus:'', religiousRule:'auto', religiousNote:'',
    hardCanon:'', storyline:'', beatIndex:0,
    pacing:'slow', customUnlockEpisode:8,
    adultFrequency:'sparse', cooldown:2, variety:'high', varietyWindow:5,
    postUnlockPace:'natural', postUnlockInterval:3,
    sexualDialogueMode:'auto', flirtUnlockEpisode:7, explicitTalkUnlockEpisode:12, professionalBoundary:true, possessiveLateReveal:true,
    dirtyTalk:70, profanity:20, insultMode:'off',
    terms:{boji:false,jaji:false,jot:false,jotmul:false,jeot:false,jeottong:false},
    appearanceEnabled:true,
    appearance:{
      female:{height:'165', bust:'D+', waist:'slim', hips:'round', skin:'bright', faceShape:'oval', eyes:'soft', nose:'balanced', lips:'full', impression:'soft', hairLength:'long', hairStyle:'wave', hairColor:'dark_brown', vibe:'', custom:''},
      male:{height:'188', build:'broad', skin:'neutral', faceShape:'sharp', eyes:'sharp', nose:'high', lips:'defined', impression:'clean', hairLength:'short', hairStyle:'neat', hairColor:'black', vibe:'', custom:''}
    },
    intimacyPatterns:INTIMACY_PATTERNS.map(x=>x[0]),
    runtime:{timeline:[],openThreads:[],scenes:[],relationshipState:'',lastAdultEpisode:0,retryCount:0}
  };

  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function esc(v){ return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function safeParse(raw,fallback){ try { return JSON.parse(raw); } catch(e){ return fallback; } }

  function load(){
    const legacyRaw=OLD_CFG_KEYS.map(k=>localStorage.getItem(k)).find(Boolean);
    const saved=safeParse(localStorage.getItem(CFG_KEY)||legacyRaw||'null',null);
    const cfg=clone(DEFAULT);
    if(saved&&typeof saved==='object'){
      Object.assign(cfg,saved);
      cfg.terms=Object.assign({},DEFAULT.terms,saved.terms||{});
      cfg.runtime=Object.assign({},DEFAULT.runtime,saved.runtime||{});
      cfg.appearanceEnabled = saved.appearanceEnabled !== false;
      cfg.appearance = {
        female:Object.assign({}, DEFAULT.appearance.female, ((saved.appearance||{}).female)||{}),
        male:Object.assign({}, DEFAULT.appearance.male, ((saved.appearance||{}).male)||{})
      };
      cfg.runtime.timeline=Array.isArray(cfg.runtime.timeline)?cfg.runtime.timeline:[];
      cfg.runtime.openThreads=Array.isArray(cfg.runtime.openThreads)?cfg.runtime.openThreads:[];
      cfg.runtime.scenes=Array.isArray(cfg.runtime.scenes)?cfg.runtime.scenes:[];
      cfg.intimacyPatterns=Array.isArray(saved.intimacyPatterns)?saved.intimacyPatterns:clone(DEFAULT.intimacyPatterns);
      cfg.dynamics=Array.isArray(saved.dynamics)?saved.dynamics:[];
      if(cfg.dynamics.includes('religious_conflict')){
        cfg.dynamics=cfg.dynamics.filter(x=>x!=='religious_conflict');
        if(!cfg.dynamics.includes('religious_boundary')) cfg.dynamics.push('religious_boundary');
      }
    }
    return cfg;
  }
  function save(cfg){ try { localStorage.setItem(CFG_KEY,JSON.stringify(cfg)); } catch(e){} }

  function readV33Cfg(){
    try { return JSON.parse(localStorage.getItem(V33_KEY)||'null'); } catch(e){ return null; }
  }

  function migrateAppearanceFromV33(cfg){
    if (!cfg.appearance) cfg.appearance = clone(DEFAULT.appearance);
    if (typeof cfg.appearanceEnabled !== 'boolean') cfg.appearanceEnabled = true;
    const legacy = readV33Cfg();
    if (!legacy || !legacy.profile) return cfg;
    cfg.appearanceEnabled = legacy.defaultProfile !== false;
    const p = legacy.profile || {};
    cfg.appearance.female.height = String(p.femaleHeight || cfg.appearance.female.height || '165');
    cfg.appearance.female.bust = String(p.femaleBust || cfg.appearance.female.bust || 'D+');
    cfg.appearance.female.waist = String(p.femaleWaist || cfg.appearance.female.waist || 'slim');
    cfg.appearance.female.hips = String(p.femaleHips || cfg.appearance.female.hips || 'round');
    cfg.appearance.female.skin = String(p.femaleSkin || cfg.appearance.female.skin || 'bright');
    cfg.appearance.female.impression = String(p.femaleImpression || cfg.appearance.female.impression || 'soft');
    cfg.appearance.male.height = String(p.maleHeight || cfg.appearance.male.height || '188');
    cfg.appearance.male.build = String(p.maleBuild || cfg.appearance.male.build || 'broad');
    cfg.appearance.male.impression = String(p.maleImpression || cfg.appearance.male.impression || 'clean');
    return cfg;
  }

  function syncAppearanceToV33(){
    const panel = document.getElementById('velourV33Panel');
    const legacy = readV33Cfg() || { profile:{} };
    legacy.defaultProfile = state.appearanceEnabled !== false;
    legacy.profile = Object.assign({}, legacy.profile || {}, {
      femaleHeight: String(state.appearance?.female?.height || '165'),
      femaleBust: String(state.appearance?.female?.bust || 'D+'),
      femaleWaist: String(state.appearance?.female?.waist || 'slim'),
      femaleHips: String(state.appearance?.female?.hips || 'round'),
      femaleSkin: String(state.appearance?.female?.skin || 'bright'),
      femaleImpression: String(state.appearance?.female?.impression || 'soft'),
      maleHeight: String(state.appearance?.male?.height || '188'),
      maleBuild: String(state.appearance?.male?.build || 'broad'),
      maleImpression: String(state.appearance?.male?.impression || 'clean')
    });
    try { localStorage.setItem(V33_KEY, JSON.stringify(legacy)); } catch(e){}
    if(panel){
      const setVal = (id,val)=>{ const el=panel.querySelector('#'+id); if(el) el.value = val; };
      const setChk = (id,val)=>{ const el=panel.querySelector('#'+id); if(el) el.checked = !!val; };
      setChk('v33ProfileOn', legacy.defaultProfile);
      setVal('v33FemaleHeight', legacy.profile.femaleHeight);
      setVal('v33FemaleBust', legacy.profile.femaleBust);
      setVal('v33FemaleWaist', legacy.profile.femaleWaist);
      setVal('v33FemaleHips', legacy.profile.femaleHips);
      setVal('v33FemaleSkin', legacy.profile.femaleSkin);
      setVal('v33FemaleImpression', legacy.profile.femaleImpression);
      setVal('v33MaleHeight', legacy.profile.maleHeight);
      setVal('v33MaleBuild', legacy.profile.maleBuild);
      setVal('v33MaleImpression', legacy.profile.maleImpression);
    }
  }

  function optionLabel(items, id){ return (items.find(x=>x[0]===id)||['',id])[1]; }

  let state=load();
  state = migrateAppearanceFromV33(state);
  save(state); // persist migrated V4.3/V4.2/V4.1/V4.0 config immediately under V4.4 key

  function epNumber(){
    try { if(typeof episodeCount!=='undefined') return Number(episodeCount||1); } catch(e){}
    const m=(document.getElementById('resultTitle')?.textContent||'').match(/(\d+)/);
    return m?Number(m[1]):1;
  }

  function resetRuntime(){
    state.runtime=clone(DEFAULT.runtime);
    state.beatIndex=0;
    save(state);
    syncUI();
  }

  function worldLabel(){ return (WORLDS.find(x=>x[0]===state.world)||['',state.world])[1]; }
  function relationshipLabel(){ return (RELATIONSHIPS.find(x=>x[0]===state.relationship)||['',state.relationship])[1]; }
  function trajectoryLabel(){ return (TRAJECTORIES.find(x=>x[0]===state.trajectory)||['',state.trajectory])[1]; }
  function histStyleLabel(){ return (HISTORICAL_STYLES.find(x=>x[0]===state.historicalStyle)||['',state.historicalStyle])[1]; }

  function storylineBeats(){
    return String(state.storyline||'').split(/\n+/).map(x=>x.replace(/^\s*(?:\d+[.)]|[-*•])\s*/,'').trim()).filter(Boolean);
  }

  function unlockEpisode(){
    if(state.pacing==='ultra') return 12;
    if(state.pacing==='slow') return 8;
    if(state.pacing==='balanced') return 5;
    if(state.pacing==='fast') return 3;
    return Math.max(1,Number(state.customUnlockEpisode||8));
  }

  function selectOptions(items, selected){
    return items.map(([id,label])=>`<option value="${esc(id)}"${id===selected?' selected':''}>${esc(label)}</option>`).join('');
  }

  function occupationOptions(category, selected){
    const rows=OCCUPATIONS[category]||[];
    return rows.map(v=>`<option value="${esc(v)}"${v===selected?' selected':''}>${esc(v)}</option>`).join('');
  }

  function selectListOptions(items, selected){
    return items.map(([id,label])=>`<option value="${esc(id)}"${id===selected?' selected':''}>${esc(label)}</option>`).join('');
  }

  function installCss(){
    if(document.getElementById('velour-v40-css'))return;
    const st=document.createElement('style'); st.id='velour-v40-css'; st.textContent=`
      .v40-panel{position:relative;border:1px solid rgba(245,196,107,.32);background:linear-gradient(180deg,rgba(28,8,17,.94),rgba(18,5,12,.92));border-radius:22px;padding:16px;margin:0 0 16px}
      .v40-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.v40-title b{color:#ffebaa;font-size:13px}.v40-badge{font-size:9px;color:#bca7b2}
      .v41-quick{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 8px}.v41-pill{border:1px solid rgba(245,196,107,.16);background:rgba(245,196,107,.055);color:#d7c0ca;border-radius:999px;padding:4px 7px;font-size:9px}
      .v41-legacy-hidden{display:none!important}.v41-intensity-mount .form-row{margin:0}.v41-intensity-mount label{display:block;color:#bca7b2;font-size:9.8px;margin:0 0 5px}
      .v40-section{border-top:1px solid rgba(245,196,107,.13);padding-top:13px;margin-top:13px}.v40-section:first-of-type{border-top:0;padding-top:0;margin-top:0}
      .v40-section h4{margin:0 0 9px;color:#f5c46b;font-size:11.5px}.v40-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.v40-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}
      .v40-field label{display:block;color:#bca7b2;font-size:9.8px;margin:0 0 5px}.v40-field select,.v40-field input,.v40-field textarea{width:100%;box-sizing:border-box}.v40-field textarea{min-height:84px;resize:vertical}
      .v40-checks{display:flex;flex-wrap:wrap;gap:6px}.v40-chip{display:flex;align-items:center;gap:5px;border:1px solid rgba(245,196,107,.17);background:rgba(255,255,255,.03);padding:6px 8px;border-radius:10px;color:#d6c2cc;font-size:9.8px}.v40-chip input{width:auto;accent-color:#f5c46b}
      .v40-slider{display:grid;grid-template-columns:1fr 40px;gap:7px;align-items:center}.v40-slider input[type=range]{width:100%}.v40-value{text-align:center;color:#ffebaa;font-size:10px}
      .v40-status{margin-top:10px;padding:9px 10px;border-radius:12px;background:rgba(245,196,107,.075);font-size:10px;color:#ead7c0;line-height:1.55}
      .v40-beat{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:8px}.v40-beat button{border:1px solid rgba(245,196,107,.22);background:rgba(245,196,107,.08);color:#ffdf98;border-radius:9px;padding:6px 9px;font-size:10px}.v40-danger{color:#ffb7c2!important;border-color:rgba(255,120,140,.25)!important;background:rgba(255,100,120,.05)!important}
      .v40-note{font-size:9.5px;color:#9f8794;line-height:1.5;margin-top:6px}.v40-summary{font-size:10px;color:#cdb9c3;line-height:1.6}
      details.v40-section{border:1px solid rgba(245,196,107,.12);border-radius:14px;padding:0;margin:8px 0 0;background:rgba(255,255,255,.018)}
      details.v40-section summary{list-style:none;cursor:pointer;color:#f5c46b;font-weight:700;font-size:11px;padding:11px 12px;margin:0;display:flex;align-items:center;justify-content:space-between}details.v40-section summary::-webkit-details-marker{display:none}details.v40-section summary:after{content:'＋';color:#9f8794;font-size:13px}details.v40-section[open] summary:after{content:'－'}details.v40-section[open] summary{border-bottom:1px solid rgba(245,196,107,.10);margin-bottom:10px}details.v40-section>*:not(summary){margin-left:12px;margin-right:12px}details.v40-section>.v40-note:last-child,details.v40-section>.v40-field:last-child,details.v40-section>.v40-grid:last-child,details.v40-section>.v40-beat:last-child{margin-bottom:12px}
      @media(max-width:430px){.v40-grid,.v40-grid3{grid-template-columns:1fr}.v40-panel{padding:13px}}
    `; document.head.appendChild(st);
  }

  function installUI(){
    if(document.getElementById('velourV40Panel')) return;
    const helper=document.getElementById('velourV33Panel');
    const anchor=helper || document.querySelector('.card-panel') || document.querySelector('.hero-banner');
    if(!anchor) return;
    const p=document.createElement('section'); p.id='velourV40Panel'; p.className='v40-panel';
    p.innerHTML=`
      <div class="v40-title"><b>✦ STORY ENGINE V4.4.4 · CLEAN + SLOWBURN</b><span class="v40-badge">기존 저장함 호환</span></div>
      <div class="v41-quick" id="v41Quick"></div>

      <details class="v40-section" id="v41SecWorld">
        <summary>1. 세계관 · 관계 · 트로프</summary>
        <div class="v40-grid">
          <div class="v40-field"><label>배경 / 세계관</label><select id="v4World">${selectOptions(WORLDS,state.world)}</select></div>
          <div class="v40-field"><label>현재 관계</label><select id="v4Relationship">${selectOptions(RELATIONSHIPS,state.relationship)}</select></div>
          <div class="v40-field"><label>관계 변화 방향</label><select id="v4Trajectory">${selectOptions(TRAJECTORIES,state.trajectory)}</select></div>
          <div class="v40-field" id="v41HistoricalField"><label>시대극 문체</label><select id="v4HistoricalStyle">${selectOptions(HISTORICAL_STYLES,state.historicalStyle)}</select></div>
        </div>
        <div class="v40-field" id="v43PeriodField" style="margin-top:9px"><label>시대/지역/국가 메모 · 선택</label><input id="v43PeriodNote" placeholder="예: 조선 후기 한양 / 19세기 영국풍 가상국가 / 당나라풍 가상왕조" value="${esc(state.periodNote||'')}"></div>
        <div class="v40-field" style="margin-top:9px"><label>추가 관계 다이내믹 / 트로프 · 다중 선택</label><div class="v40-checks" id="v4Dynamics">${DYNAMICS.map(([id,label])=>`<label class="v40-chip"><input type="checkbox" value="${id}"${state.dynamics.includes(id)?' checked':''}>${esc(label)}</label>`).join('')}</div></div>
        <div class="v40-note">‘현재 관계’는 한 가지 핵심 상태로 고정하고, 집착·질투·금기 같은 맛은 여기서 추가해. 기존 V3.5 관계 태그는 프롬프트에 중복 삽입하지 않아.</div>
      </details>

      <details class="v40-section" id="v41SecOccupation">
        <summary>2. 주인공 직업 · 신분</summary>
        <div class="v40-grid">
          <div>
            <div class="v40-field"><label>A 직업군</label><select id="v4OccCatA">${Object.keys(OCCUPATIONS).map(k=>`<option${k===state.occCategoryA?' selected':''}>${esc(k)}</option>`).join('')}</select></div>
            <div class="v40-field" style="margin-top:7px"><label>A 세부 직업</label><select id="v4OccA">${occupationOptions(state.occCategoryA,state.occupationA)}</select></div>
            <div class="v40-field" style="margin-top:7px"><label>A 신분/계층</label><select id="v4SocialA"><option value="ordinary">평범/일반</option><option value="affluent">유복함</option><option value="chaebol">재벌/후계자</option><option value="royal">왕족</option><option value="noble">귀족/양반</option><option value="hidden">숨겨진 신분 반전 허용</option><option value="custom">사용자 설정 우선</option></select></div>
          </div>
          <div>
            <div class="v40-field"><label>B 직업군</label><select id="v4OccCatB">${Object.keys(OCCUPATIONS).map(k=>`<option${k===state.occCategoryB?' selected':''}>${esc(k)}</option>`).join('')}</select></div>
            <div class="v40-field" style="margin-top:7px"><label>B 세부 직업</label><select id="v4OccB">${occupationOptions(state.occCategoryB,state.occupationB)}</select></div>
            <div class="v40-field" style="margin-top:7px"><label>B 신분/계층</label><select id="v4SocialB"><option value="ordinary">평범/일반</option><option value="affluent">유복함</option><option value="chaebol">재벌/후계자</option><option value="royal">왕족</option><option value="noble">귀족/양반</option><option value="hidden">숨겨진 신분 반전 허용</option><option value="custom">사용자 설정 우선</option></select></div>
          </div>
        </div>
        <div class="v40-field" id="v41MilitaryField" style="margin-top:8px"><label>군인일 때 현재 상태</label><input id="v4MilitaryStatus" placeholder="예: 휴가 중 / 훈련 중 / 파견 / 복귀 직전 / 전역 임박" value="${esc(state.militaryStatus)}"></div>
        <div id="v42ReligionField" style="margin-top:9px">
          <div class="v40-grid">
            <div class="v40-field"><label>종교계 캐릭터 규율 처리</label><select id="v4ReligiousRule">${selectOptions(RELIGIOUS_RULES,state.religiousRule)}</select></div>
            <div class="v40-field"><label>종교/종파·규율 메모 (선택)</label><input id="v4ReligiousNote" value="${esc(state.religiousNote)}" placeholder="예: 가톨릭 신부 / 조계종 승려 / 기혼 개신교 목사"></div>
          </div>
          <div class="v40-note">개신교 목사·전도사는 기본적으로 결혼/자녀가 가능한 직업으로 처리해. 성생활 자체를 자동으로 ‘파계’로 만들지 않고, 가톨릭 독신 성직자·수도자와 구분한다.</div>
        </div>
        <div class="v40-section" style="margin-top:12px">
          <h4>캐릭터 외형 · 얼굴 설정</h4>
          <label class="v33-check" style="margin-bottom:8px"><span>기본 캐릭터 외형 프리셋 사용</span><input type="checkbox" id="v44AppearanceOn"></label>
          <div class="v40-note">키·체형·얼굴·헤어의 기본 앵커를 여기서 지정해. 아래 ‘인물 구도 및 성격’ 칸에 외형을 직접 적으면 그 지시가 우선하되, 별도 지시가 없으면 이 설정을 연재 내내 유지한다.</div>
          <div class="v40-grid" style="margin-top:9px">
            <div>
              <h4 style="margin:0 0 8px">여주 외형</h4>
              <div class="v40-grid">
                <div class="v40-field"><label>키 (cm)</label><input id="v44FemaleHeight" type="number" min="145" max="195" step="1"></div>
                <div class="v40-field"><label>가슴 볼륨</label><select id="v44FemaleBust"><option value="D+">풍만 · D 이상</option><option value="full">풍만</option><option value="medium">중간</option><option value="small">아담함</option><option value="custom">사용자 설정 우선</option></select></div>
                <div class="v40-field"><label>허리</label><select id="v44FemaleWaist"><option value="slim">가늘고 선명한 허리선</option><option value="natural">자연스러운 곡선</option><option value="straight">직선적/담백한 라인</option></select></div>
                <div class="v40-field"><label>힙</label><select id="v44FemaleHips"><option value="round">크고 둥글며 탄탄한 힙</option><option value="balanced">균형 잡힌 힙</option><option value="slim">슬림한 힙라인</option></select></div>
                <div class="v40-field"><label>피부톤</label><select id="v44FemaleSkin">${selectListOptions(SKIN_TONES, state.appearance?.female?.skin || 'bright')}</select></div>
                <div class="v40-field"><label>얼굴형</label><select id="v44FemaleFace">${selectListOptions(FACE_SHAPES, state.appearance?.female?.faceShape || 'oval')}</select></div>
                <div class="v40-field"><label>눈매</label><select id="v44FemaleEyes">${selectListOptions(EYE_STYLES, state.appearance?.female?.eyes || 'soft')}</select></div>
                <div class="v40-field"><label>코</label><select id="v44FemaleNose">${selectListOptions(NOSE_STYLES, state.appearance?.female?.nose || 'balanced')}</select></div>
                <div class="v40-field"><label>입술</label><select id="v44FemaleLips">${selectListOptions(LIP_STYLES, state.appearance?.female?.lips || 'full')}</select></div>
                <div class="v40-field"><label>전체 인상</label><select id="v44FemaleImpression">${selectListOptions(FEMALE_IMPRESSIONS, state.appearance?.female?.impression || 'soft')}</select></div>
                <div class="v40-field"><label>헤어 길이</label><select id="v44FemaleHairLength">${selectListOptions(FEMALE_HAIR_LENGTHS, state.appearance?.female?.hairLength || 'long')}</select></div>
                <div class="v40-field"><label>헤어 스타일</label><select id="v44FemaleHairStyle">${selectListOptions(FEMALE_HAIR_STYLES, state.appearance?.female?.hairStyle || 'wave')}</select></div>
                <div class="v40-field"><label>헤어 컬러</label><select id="v44FemaleHairColor">${selectListOptions(HAIR_COLORS, state.appearance?.female?.hairColor || 'dark_brown')}</select></div>
                <div class="v40-field"><label>모델/분위기 메모</label><input id="v44FemaleVibe" value="${esc(state.appearance?.female?.vibe || '')}" placeholder="예: 청순한데 묘하게 여우상"></div>
              </div>
              <div class="v40-field" style="margin-top:7px"><label>여주 외형 직접 메모 (선택)</label><textarea id="v44FemaleCustom" placeholder="예: 긴 속눈썹, 웃을 때 입꼬리 올라감, 흑발 레이어드">${esc(state.appearance?.female?.custom || '')}</textarea></div>
            </div>
            <div>
              <h4 style="margin:0 0 8px">남주 외형</h4>
              <div class="v40-grid">
                <div class="v40-field"><label>키 (cm)</label><input id="v44MaleHeight" type="number" min="160" max="210" step="1"></div>
                <div class="v40-field"><label>체격</label><select id="v44MaleBuild"><option value="broad">큰 체격·넓은 어깨·강한 피지컬</option><option value="lean">키 크고 날렵한 근육형</option><option value="balanced">균형 잡힌 체격</option><option value="slim">슬림하고 가벼운 체형</option></select></div>
                <div class="v40-field"><label>피부톤</label><select id="v44MaleSkin">${selectListOptions(SKIN_TONES, state.appearance?.male?.skin || 'neutral')}</select></div>
                <div class="v40-field"><label>얼굴형</label><select id="v44MaleFace">${selectListOptions(FACE_SHAPES, state.appearance?.male?.faceShape || 'sharp')}</select></div>
                <div class="v40-field"><label>눈매</label><select id="v44MaleEyes">${selectListOptions(EYE_STYLES, state.appearance?.male?.eyes || 'sharp')}</select></div>
                <div class="v40-field"><label>코</label><select id="v44MaleNose">${selectListOptions(NOSE_STYLES, state.appearance?.male?.nose || 'high')}</select></div>
                <div class="v40-field"><label>입술</label><select id="v44MaleLips">${selectListOptions(LIP_STYLES, state.appearance?.male?.lips || 'defined')}</select></div>
                <div class="v40-field"><label>전체 인상</label><select id="v44MaleImpression">${selectListOptions(MALE_IMPRESSIONS, state.appearance?.male?.impression || 'clean')}</select></div>
                <div class="v40-field"><label>헤어 길이</label><select id="v44MaleHairLength">${selectListOptions(MALE_HAIR_LENGTHS, state.appearance?.male?.hairLength || 'short')}</select></div>
                <div class="v40-field"><label>헤어 스타일</label><select id="v44MaleHairStyle">${selectListOptions(MALE_HAIR_STYLES, state.appearance?.male?.hairStyle || 'neat')}</select></div>
                <div class="v40-field"><label>헤어 컬러</label><select id="v44MaleHairColor">${selectListOptions(HAIR_COLORS, state.appearance?.male?.hairColor || 'black')}</select></div>
                <div class="v40-field"><label>모델/분위기 메모</label><input id="v44MaleVibe" value="${esc(state.appearance?.male?.vibe || '')}" placeholder="예: 냉미남, 선 굵고 단정함"></div>
              </div>
              <div class="v40-field" style="margin-top:7px"><label>남주 외형 직접 메모 (선택)</label><textarea id="v44MaleCustom" placeholder="예: 진한 눈썹, 높은 콧대, 짧은 흑발">${esc(state.appearance?.male?.custom || '')}</textarea></div>
            </div>
          </div>
        </div>
      </details>

      <details class="v40-section" id="v41SecCanon">
        <summary>3. HARD CANON · 스토리라인 잠금</summary>
        <div class="v40-field"><label>절대 바뀌면 안 되는 설정</label><textarea id="v4HardCanon" placeholder="예: 두 사람은 평범한 집안의 소꿉친구. 서로를 이름으로 부름. 남주는 재벌/도련님 설정이 아님. 숨겨진 신분 반전 없음.">${esc(state.hardCanon)}</textarea></div>
        <div class="v40-field" style="margin-top:8px"><label>순서대로 진행할 CANON STORYLINE · 한 줄에 한 단계</label><textarea id="v4Storyline" placeholder="1. 오랜만에 다시 자주 마주침\n2. 사소한 질투가 생김\n3. 서로 감정을 자각하지만 말하지 않음\n4. 첫 명확한 고백\n5. 관계가 바뀜">${esc(state.storyline)}</textarea></div>
        <div class="v40-beat"><span id="v4BeatStatus" class="v40-summary"></span><button id="v4BeatPrev">← 이전 단계</button><button id="v4BeatNext">현재 단계 완료 →</button><button id="v4RuntimeReset" class="v40-danger">연재 메모리 초기화</button></div>
        <div class="v40-note">한 단계는 여러 화에 걸쳐 확장 가능. 완료되기 전 다음 단계 선행·건너뛰기는 금지. 마지막 단계까지 끝나면 ‘전체 완료’ 상태로 잠겨.</div>
      </details>

      <details class="v40-section" id="v41SecPacing">
        <summary>4. 서사 속도 · 성인 장면 빈도/다양성</summary>
        <div class="v40-grid">
          <div class="v40-field"><label>관계 진행 속도</label><select id="v4Pacing">${selectOptions(PACING,state.pacing)}</select></div>
          <div class="v40-field"><label>첫 성인 장면 해금 화 (CUSTOM)</label><input id="v4Unlock" type="number" min="1" max="99" value="${Number(state.customUnlockEpisode||8)}"></div>
          <div class="v40-field"><label>성인 장면 빈도</label><select id="v4AdultFrequency"><option value="rare">매우 적음 · 사건/감정 중심</option><option value="sparse">적음 · 충분히 축적 후</option><option value="balanced">보통</option><option value="frequent">많음</option><option value="very_frequent">매우 많음</option></select></div>
          <div class="v40-field"><label>성인 장면 후 쿨다운</label><select id="v4Cooldown"><option value="0">없음</option><option value="1">최소 1화</option><option value="2">최소 2화</option><option value="3">최소 3화</option></select></div>
          <div class="v40-field"><label>첫 관계 해금 후 페이스</label><select id="v445PostUnlockPace"><option value="steady">천천히 유지 · 해금 뒤에도 여유 있게</option><option value="natural">자연스럽게 적극화 · 정체 방지 (추천)</option><option value="active">적극적 · 빈도 설정에 맞춰 확실히 진전</option><option value="custom">CUSTOM · 목표 간격 직접 지정</option></select></div>
          <div class="v40-field v445-post-custom"><label>해금 후 성인 장면 목표 간격</label><input id="v445PostUnlockInterval" type="number" min="1" max="12" value="${Number(state.postUnlockInterval||3)}"></div>
          <div class="v40-field"><label>장면 다양성</label><select id="v4Variety"><option value="normal">보통</option><option value="high">높음</option><option value="max">매우 높음</option></select></div>
          <div class="v40-field"><label>최근 반복 금지 범위</label><select id="v4VarietyWindow"><option value="3">최근 3회</option><option value="5">최근 5회</option><option value="8">최근 8회</option></select></div>
          <div class="v40-field"><label>성적 대사 진행</label><select id="v443DialogueMode"><option value="auto">AUTO · 서사 단계에 맞춰 점진 해금</option><option value="custom">CUSTOM · 직접 해금 화 지정</option></select></div>
          <div class="v40-field v443-dialogue-custom"><label>로맨틱 플러팅 해금 화</label><input id="v443FlirtUnlock" type="number" min="1" max="99" value="${Number(state.flirtUnlockEpisode||7)}"></div>
          <div class="v40-field v443-dialogue-custom"><label>노골적 성적 대사 해금 화</label><input id="v443ExplicitUnlock" type="number" min="1" max="99" value="${Number(state.explicitTalkUnlockEpisode||12)}"></div>
        </div>
        <div class="v40-checks" style="margin-top:9px">
          <label class="v40-chip"><input type="checkbox" id="v443ProfessionalBoundary">직업 경계 강화 · PT/의료/교육/성직/상하관계</label>
          <label class="v40-chip"><input type="checkbox" id="v443PossessiveLate">집착·소유욕은 관계 누적 뒤 발현</label>
        </div>
        <div class="v40-note">더티톡 수치는 ‘지금 당장 말하는 강도’가 아니라 <b>해금 후 최대 강도</b>로 적용해. AUTO에서는 첫 성인 장면 해금 화를 기준으로 내적 끌림 → 관심 → 플러팅 → 직접 성적 언어 순서로 늦춰. <b>첫 관계 해금 후 페이스</b>는 그 이후에도 계속 대화만 하며 정체되는 걸 막는 별도 축이야.</div>
        <div class="v40-field" style="margin-top:9px"><label>허용할 장면 구도 풀 · 최근 사용 구도는 자동 회피</label><div class="v40-checks" id="v4PatternChecks">${INTIMACY_PATTERNS.map(([id,label])=>`<label class="v40-chip"><input type="checkbox" value="${id}"${state.intimacyPatterns.includes(id)?' checked':''}>${esc(label)}</label>`).join('')}</div></div>
      </details>

      <details class="v40-section" id="v41SecLanguage">
        <summary>5. 문체 · 수위 · 더티톡/욕설/직접 호칭</summary>
        <div id="v41IntensityMount" class="v41-intensity-mount"></div>
        <div class="v40-grid" style="margin-top:9px">
          <div class="v40-field"><label>더티톡 강도</label><div class="v40-slider"><input id="v4Dirty" type="range" min="0" max="100" value="${Number(state.dirtyTalk||0)}"><span class="v40-value" id="v4DirtyVal"></span></div></div>
          <div class="v40-field"><label>욕설 강도</label><div class="v40-slider"><input id="v4Profanity" type="range" min="0" max="100" value="${Number(state.profanity||0)}"><span class="v40-value" id="v4ProfanityVal"></span></div></div>
        </div>
        <div class="v40-field" style="margin-top:8px"><label>상대 비하형 욕설</label><select id="v4Insult"><option value="off">OFF · 사람을 ‘-년’ 계열로 부르는 비하욕 금지</option><option value="light">약하게 허용 · 비하적 멸칭은 계속 금지</option><option value="custom">사용자 하드캐논 지시 우선</option></select></div>
        <div class="v40-field" style="margin-top:9px"><label>직접 신체 호칭 · 단어별 허용</label><div class="v40-checks" id="v4TermChecks">
          <label class="v40-chip"><input type="checkbox" data-term="boji"${state.terms.boji?' checked':''}>보지</label>
          <label class="v40-chip"><input type="checkbox" data-term="jaji"${state.terms.jaji?' checked':''}>자지</label>
          <label class="v40-chip"><input type="checkbox" data-term="jot"${state.terms.jot?' checked':''}>좆</label>
          <label class="v40-chip"><input type="checkbox" data-term="jotmul"${state.terms.jotmul?' checked':''}>좆물</label>
          <label class="v40-chip"><input type="checkbox" data-term="jeot"${state.terms.jeot?' checked':''}>젖</label>
          <label class="v40-chip"><input type="checkbox" data-term="jeottong"${state.terms.jeottong?' checked':''}>젖통</label>
        </div></div>
        <div class="v40-note">더티톡 강도와 욕설 강도는 독립. 혼잣말/감탄형 욕설은 별도로 허용 가능하지만 상대를 성별 비하형 호칭으로 부르는 표현은 기본 금지.</div>
      </details>

      <div class="v40-status" id="v4Status"></div>
    `;
    if(helper) helper.parentNode.insertBefore(p,helper); else anchor.insertAdjacentElement('afterend',p);
    bindUI(); compactLegacyUI(); syncUI();
  }

  function bindUI(){
    const p=document.getElementById('velourV40Panel'); if(!p)return;
    const map={v4World:'world',v4Relationship:'relationship',v4Trajectory:'trajectory',v4HistoricalStyle:'historicalStyle',v43PeriodNote:'periodNote',v4SocialA:'socialA',v4SocialB:'socialB',v4MilitaryStatus:'militaryStatus',v4ReligiousRule:'religiousRule',v4ReligiousNote:'religiousNote',v4HardCanon:'hardCanon',v4Storyline:'storyline',v4Pacing:'pacing',v4Unlock:'customUnlockEpisode',v4AdultFrequency:'adultFrequency',v4Cooldown:'cooldown',v445PostUnlockPace:'postUnlockPace',v445PostUnlockInterval:'postUnlockInterval',v4Variety:'variety',v4VarietyWindow:'varietyWindow',v443DialogueMode:'sexualDialogueMode',v443FlirtUnlock:'flirtUnlockEpisode',v443ExplicitUnlock:'explicitTalkUnlockEpisode',v4Dirty:'dirtyTalk',v4Profanity:'profanity',v4Insult:'insultMode'};
    Object.entries(map).forEach(([id,key])=>{
      const el=p.querySelector('#'+id); if(!el)return;
      const ev=(el.tagName==='TEXTAREA'||el.type==='range'||el.type==='number'||el.tagName==='INPUT')?'input':'change';
      el.addEventListener(ev,()=>{ state[key]=(el.type==='number'||el.type==='range')?Number(el.value):el.value; save(state); syncUI(false); });
    });
    p.querySelector('#v4OccCatA')?.addEventListener('change',e=>{state.occCategoryA=e.target.value; state.occupationA=(OCCUPATIONS[state.occCategoryA]||[])[0]||''; save(state); rebuildOccupation('A'); syncUI(false);});
    p.querySelector('#v4OccCatB')?.addEventListener('change',e=>{state.occCategoryB=e.target.value; state.occupationB=(OCCUPATIONS[state.occCategoryB]||[])[0]||''; save(state); rebuildOccupation('B'); syncUI(false);});
    p.querySelector('#v4OccA')?.addEventListener('change',e=>{state.occupationA=e.target.value;save(state);syncUI(false);});
    p.querySelector('#v4OccB')?.addEventListener('change',e=>{state.occupationB=e.target.value;save(state);syncUI(false);});
    p.querySelectorAll('#v4TermChecks input').forEach(el=>el.addEventListener('change',()=>{state.terms[el.dataset.term]=el.checked;save(state);syncUI(false);}));
    p.querySelectorAll('#v4PatternChecks input').forEach(el=>el.addEventListener('change',()=>{state.intimacyPatterns=[...p.querySelectorAll('#v4PatternChecks input:checked')].map(x=>x.value);save(state);syncUI(false);}));
    p.querySelectorAll('#v4Dynamics input').forEach(el=>el.addEventListener('change',()=>{state.dynamics=[...p.querySelectorAll('#v4Dynamics input:checked')].map(x=>x.value);save(state);syncUI(false);}));
    p.querySelector('#v443ProfessionalBoundary')?.addEventListener('change',e=>{state.professionalBoundary=!!e.target.checked;save(state);syncUI(false);});
    p.querySelector('#v443PossessiveLate')?.addEventListener('change',e=>{state.possessiveLateReveal=!!e.target.checked;save(state);syncUI(false);});
    p.querySelector('#v4BeatPrev')?.addEventListener('click',()=>{state.beatIndex=Math.max(0,Number(state.beatIndex||0)-1);save(state);syncUI(false);});
    p.querySelector('#v4BeatNext')?.addEventListener('click',()=>{const beats=storylineBeats();state.beatIndex=Math.min(beats.length,Number(state.beatIndex||0)+1);save(state);syncUI(false);});
    p.querySelector('#v4RuntimeReset')?.addEventListener('click',()=>{ if(confirm('V4 연재 메모리와 스토리라인 진행 단계를 초기화할까? 설정값 자체는 유지돼.')) resetRuntime(); });
    p.querySelector('#v44AppearanceOn')?.addEventListener('change',e=>{ state.appearanceEnabled = !!e.target.checked; save(state); syncAppearanceToV33(); syncUI(false); });
    [
      ['v44FemaleHeight','female','height',true],['v44FemaleBust','female','bust',false],['v44FemaleWaist','female','waist',false],['v44FemaleHips','female','hips',false],['v44FemaleSkin','female','skin',false],['v44FemaleFace','female','faceShape',false],['v44FemaleEyes','female','eyes',false],['v44FemaleNose','female','nose',false],['v44FemaleLips','female','lips',false],['v44FemaleImpression','female','impression',false],['v44FemaleHairLength','female','hairLength',false],['v44FemaleHairStyle','female','hairStyle',false],['v44FemaleHairColor','female','hairColor',false],['v44FemaleVibe','female','vibe',false],['v44FemaleCustom','female','custom',false],
      ['v44MaleHeight','male','height',true],['v44MaleBuild','male','build',false],['v44MaleSkin','male','skin',false],['v44MaleFace','male','faceShape',false],['v44MaleEyes','male','eyes',false],['v44MaleNose','male','nose',false],['v44MaleLips','male','lips',false],['v44MaleImpression','male','impression',false],['v44MaleHairLength','male','hairLength',false],['v44MaleHairStyle','male','hairStyle',false],['v44MaleHairColor','male','hairColor',false],['v44MaleVibe','male','vibe',false],['v44MaleCustom','male','custom',false]
    ].forEach(([id,who,key,isNum])=>{
      const el = p.querySelector('#'+id); if(!el) return;
      const ev = (el.tagName==='TEXTAREA' || el.tagName==='INPUT') ? 'input' : 'change';
      el.addEventListener(ev,()=>{
        if(!state.appearance) state.appearance = clone(DEFAULT.appearance);
        if(!state.appearance[who]) state.appearance[who] = clone(DEFAULT.appearance[who]);
        state.appearance[who][key] = isNum ? String(el.value || '') : el.value;
        save(state); syncAppearanceToV33(); syncUI(false);
      });
    });
  }

  function compactLegacyUI(){
    const p=document.getElementById('velourV40Panel'); if(!p)return;
    const intensity=document.getElementById('selectIntensity');
    const mount=p.querySelector('#v41IntensityMount');
    if(intensity&&mount&&!mount.contains(intensity)){
      const row=intensity.closest('.form-row')||intensity.parentElement;
      if(row){
        const label=row.querySelector('label'); if(label) label.textContent='묘사 톤 & 수위 (기존 엔진과 연동)';
        mount.appendChild(row);
      }
    }
    const genre=document.getElementById('selectGenre');
    const legacyCard=genre?.closest('.card-panel');
    if(legacyCard) legacyCard.classList.add('v41-legacy-hidden');
    const rel=document.getElementById('v33RelationshipBlock'); if(rel) rel.classList.add('v41-legacy-hidden');
    document.querySelectorAll('[data-v33rel]').forEach(el=>el.classList.remove('active'));
    const helper=document.getElementById('velourV33Panel');
    if(helper){
      const tag=helper.querySelector('.panel-tag'); if(tag) tag.textContent='02. GENERATION HELPERS · V3.5';
      const profile=helper.querySelector('details.v33-profile'); if(profile) profile.classList.add('v41-legacy-hidden');
      const profileToggle=helper.querySelector('#v33ProfileOn')?.closest('.v33-check'); if(profileToggle) profileToggle.classList.add('v41-legacy-hidden');
      const profileNote=helper.querySelector('details.v33-profile + .v33-mini'); if(profileNote) profileNote.classList.add('v41-legacy-hidden');
    }
    syncAppearanceToV33();
  }

  function legacyActiveTagsSuppressed(fn){
    const active=[...document.querySelectorAll('#tropeTags .tag-pill.active')];
    active.forEach(el=>el.classList.remove('active'));
    try{return fn();}finally{active.forEach(el=>el.classList.add('active'));}
  }

  function rebuildOccupation(who){
    const p=document.getElementById('velourV40Panel'); if(!p)return;
    const cat=state['occCategory'+who], sel=p.querySelector('#v4Occ'+who); if(!sel)return;
    sel.innerHTML=occupationOptions(cat,state['occupation'+who]); sel.value=state['occupation'+who];
  }

  function syncUI(full=true){
    const p=document.getElementById('velourV40Panel'); if(!p)return;
    if(full){
      const values={v4World:state.world,v4Relationship:state.relationship,v4Trajectory:state.trajectory,v4HistoricalStyle:state.historicalStyle,v43PeriodNote:state.periodNote,v4OccCatA:state.occCategoryA,v4OccCatB:state.occCategoryB,v4OccA:state.occupationA,v4OccB:state.occupationB,v4SocialA:state.socialA,v4SocialB:state.socialB,v4MilitaryStatus:state.militaryStatus,v4ReligiousRule:state.religiousRule,v4ReligiousNote:state.religiousNote,v4HardCanon:state.hardCanon,v4Storyline:state.storyline,v4Pacing:state.pacing,v4Unlock:state.customUnlockEpisode,v4AdultFrequency:state.adultFrequency,v4Cooldown:state.cooldown,v445PostUnlockPace:state.postUnlockPace,v445PostUnlockInterval:state.postUnlockInterval,v4Variety:state.variety,v4VarietyWindow:state.varietyWindow,v443DialogueMode:state.sexualDialogueMode,v443FlirtUnlock:state.flirtUnlockEpisode,v443ExplicitUnlock:state.explicitTalkUnlockEpisode,v4Dirty:state.dirtyTalk,v4Profanity:state.profanity,v4Insult:state.insultMode,
        v44FemaleHeight:state.appearance?.female?.height || '', v44FemaleBust:state.appearance?.female?.bust || 'D+', v44FemaleWaist:state.appearance?.female?.waist || 'slim', v44FemaleHips:state.appearance?.female?.hips || 'round', v44FemaleSkin:state.appearance?.female?.skin || 'bright', v44FemaleFace:state.appearance?.female?.faceShape || 'oval', v44FemaleEyes:state.appearance?.female?.eyes || 'soft', v44FemaleNose:state.appearance?.female?.nose || 'balanced', v44FemaleLips:state.appearance?.female?.lips || 'full', v44FemaleImpression:state.appearance?.female?.impression || 'soft', v44FemaleHairLength:state.appearance?.female?.hairLength || 'long', v44FemaleHairStyle:state.appearance?.female?.hairStyle || 'wave', v44FemaleHairColor:state.appearance?.female?.hairColor || 'dark_brown', v44FemaleVibe:state.appearance?.female?.vibe || '', v44FemaleCustom:state.appearance?.female?.custom || '',
        v44MaleHeight:state.appearance?.male?.height || '', v44MaleBuild:state.appearance?.male?.build || 'broad', v44MaleSkin:state.appearance?.male?.skin || 'neutral', v44MaleFace:state.appearance?.male?.faceShape || 'sharp', v44MaleEyes:state.appearance?.male?.eyes || 'sharp', v44MaleNose:state.appearance?.male?.nose || 'high', v44MaleLips:state.appearance?.male?.lips || 'defined', v44MaleImpression:state.appearance?.male?.impression || 'clean', v44MaleHairLength:state.appearance?.male?.hairLength || 'short', v44MaleHairStyle:state.appearance?.male?.hairStyle || 'neat', v44MaleHairColor:state.appearance?.male?.hairColor || 'black', v44MaleVibe:state.appearance?.male?.vibe || '', v44MaleCustom:state.appearance?.male?.custom || ''};
      Object.entries(values).forEach(([id,val])=>{const el=p.querySelector('#'+id); if(el&&document.activeElement!==el)el.value=val;});
    }
    const apOn = p.querySelector('#v44AppearanceOn'); if(apOn) apOn.checked = state.appearanceEnabled !== false;
    const pb=p.querySelector('#v443ProfessionalBoundary'); if(pb) pb.checked=state.professionalBoundary!==false;
    const pl=p.querySelector('#v443PossessiveLate'); if(pl) pl.checked=state.possessiveLateReveal!==false;
    p.querySelectorAll('.v443-dialogue-custom').forEach(el=>el.style.display=state.sexualDialogueMode==='custom'?'block':'none');
    p.querySelectorAll('.v445-post-custom').forEach(el=>el.style.display=state.postUnlockPace==='custom'?'block':'none');
    const d=p.querySelector('#v4DirtyVal'); if(d)d.textContent=String(state.dirtyTalk);
    const pr=p.querySelector('#v4ProfanityVal'); if(pr)pr.textContent=String(state.profanity);
    const beats=storylineBeats(); const rawIdx=Math.max(0,Number(state.beatIndex||0)); const idx=Math.min(rawIdx,Math.max(0,beats.length-1));
    const bs=p.querySelector('#v4BeatStatus'); if(bs)bs.textContent=!beats.length?'스토리라인 미입력':rawIdx>=beats.length?`전체 ${beats.length}단계 완료`:`현재 ${idx+1}/${beats.length} · ${beats[idx]}`;
    const periodWorld=['historical_korea','historical_west','historical_real','eastern_fantasy','western_fantasy','martial_arts'].includes(state.world); const hist=p.querySelector('#v41HistoricalField'); if(hist) hist.style.display=periodWorld?'block':'none'; const periodField=p.querySelector('#v43PeriodField'); if(periodField) periodField.style.display=periodWorld?'block':'none';
    const military=p.querySelector('#v41MilitaryField'); if(military) military.style.display=(state.world==='military'||state.occCategoryA==='군인'||state.occCategoryB==='군인')?'block':'none';
    const religion=p.querySelector('#v42ReligionField'); if(religion) religion.style.display=(state.world==='religious'||state.occCategoryA==='종교·성직·수행'||state.occCategoryB==='종교·성직·수행')?'block':'none';
    const quick=p.querySelector('#v41Quick'); if(quick) quick.innerHTML=`<span class="v41-pill">${esc(worldLabel())}</span><span class="v41-pill">${esc(relationshipLabel())}</span><span class="v41-pill">${esc(state.occupationA)} × ${esc(state.occupationB)}</span><span class="v41-pill">EP.${unlockEpisode()} 이후 본격 진전</span>`;
    const s=p.querySelector('#v4Status'); if(s){
      const last=state.runtime.scenes?.slice(-1)[0];
      s.innerHTML=`<b>V4.4.4 ACTIVE</b> · ${esc(worldLabel())} · ${esc(relationshipLabel())} → ${esc(trajectoryLabel())}<br>`+
        `A ${esc(state.occupationA)} / B ${esc(state.occupationB)} · 첫 성인 장면 EP.${unlockEpisode()} · 해금 후 ${postUnlockPaceLabel()} · 성적 대사 ${state.sexualDialogueMode==='auto'?'AUTO':'CUSTOM'} · 쿨다운 ${Number(state.cooldown||0)}화<br>`+
        `장기 메모리 ${state.runtime.timeline.length}건 · 미회수 ${state.runtime.openThreads.length}건 · 장면기록 ${state.runtime.scenes.length}건${last?.pattern?` · 최근 ${esc(last.pattern)}`:''}`;
    }
  }

  function socialLabel(v){ return ({ordinary:'평범/일반',affluent:'유복함',chaebol:'재벌/후계자',royal:'왕족',noble:'귀족/양반',hidden:'숨겨진 신분 반전 허용',custom:'사용자 설정 우선'})[v]||v; }

  function bustLabel(v){ return ({'D+':'풍만 · D 이상', full:'풍만', medium:'중간', small:'아담함', custom:'사용자 설정 우선'})[v]||v; }
  function waistLabel(v){ return ({slim:'가늘고 선명한 허리선', natural:'자연스러운 곡선', straight:'직선적/담백한 라인'})[v]||v; }
  function hipsLabel(v){ return ({round:'크고 둥글며 탄탄한 힙', balanced:'균형 잡힌 힙', slim:'슬림한 힙라인'})[v]||v; }
  function buildLabel(v){ return ({broad:'큰 체격·넓은 어깨·강한 피지컬', lean:'키 크고 날렵한 근육형', balanced:'균형 잡힌 체격', slim:'슬림하고 가벼운 체형'})[v]||v; }

  function appearanceDirective(){
    if(state.appearanceEnabled===false) return `
[CHARACTER APPEARANCE]
- 기본 캐릭터 외형 프리셋은 현재 OFF. 사용자가 인물 구도/직접 지시에서 준 외형만 따른다.`;
    const f=state.appearance?.female||DEFAULT.appearance.female;
    const m=state.appearance?.male||DEFAULT.appearance.male;
    return `
[CHARACTER APPEARANCE — 연재 전체에서 일관 유지]
- 아래 외형은 비노골적 기본 앵커다. 사용자가 이번 화 지시나 인물 구도 칸에서 더 구체적으로 적은 내용이 있으면 그 지시를 우선하되, 충돌이 없으면 아래 설정을 유지한다.
- 여주: 키 약 ${f.height||165}cm, ${bustLabel(f.bust)}, ${waistLabel(f.waist)}, ${hipsLabel(f.hips)}, 피부톤 ${optionLabel(SKIN_TONES,f.skin)}, 얼굴형 ${optionLabel(FACE_SHAPES,f.faceShape)}, 눈매 ${optionLabel(EYE_STYLES,f.eyes)}, 코 ${optionLabel(NOSE_STYLES,f.nose)}, 입술 ${optionLabel(LIP_STYLES,f.lips)}, 전체 인상 ${optionLabel(FEMALE_IMPRESSIONS,f.impression)}, 헤어 ${optionLabel(FEMALE_HAIR_LENGTHS,f.hairLength)} · ${optionLabel(FEMALE_HAIR_STYLES,f.hairStyle)} · ${optionLabel(HAIR_COLORS,f.hairColor)}.${f.vibe?` 분위기 메모: ${f.vibe}.`:''}${f.custom?` 추가 외형 메모: ${f.custom}.`:''}
- 남주: 키 약 ${m.height||188}cm, 체격 ${buildLabel(m.build)}, 피부톤 ${optionLabel(SKIN_TONES,m.skin)}, 얼굴형 ${optionLabel(FACE_SHAPES,m.faceShape)}, 눈매 ${optionLabel(EYE_STYLES,m.eyes)}, 코 ${optionLabel(NOSE_STYLES,m.nose)}, 입술 ${optionLabel(LIP_STYLES,m.lips)}, 전체 인상 ${optionLabel(MALE_IMPRESSIONS,m.impression)}, 헤어 ${optionLabel(MALE_HAIR_LENGTHS,m.hairLength)} · ${optionLabel(MALE_HAIR_STYLES,m.hairStyle)} · ${optionLabel(HAIR_COLORS,m.hairColor)}.${m.vibe?` 분위기 메모: ${m.vibe}.`:''}${m.custom?` 추가 외형 메모: ${m.custom}.`:''}
- 외형은 화마다 들쭉날쭉 바뀌지 않게 유지하고, 얼굴형/눈매/헤어/신체 비율을 장면마다 잊어버리지 않는다.`;
  }

  function languageDirective(ep){
    const termMap={boji:'보지',jaji:'자지',jot:'좆',jotmul:'좆물',jeot:'젖',jeottong:'젖통'};
    const allowed=Object.entries(state.terms).filter(([,v])=>v).map(([k])=>termMap[k]);
    const gate=expressionGate(ep);
    const dirtyMax=Number(state.dirtyTalk||0);
    return `
[LANGUAGE CONTROL — 수치는 해금 뒤 최대치]
- 더티톡 설정 최대 강도: ${dirtyMax}/100. 이것은 초기 화부터 자동 적용하는 현재 강도가 아니다.
- 현재 EP.${ep}의 외부 성적 대사 허용 단계: ${gate.allowedLevel}/4 · ${gate.label}.
${gate.allowedLevel<4?'- 현재 단계보다 앞선 직접적 성적 언어는 사용하지 않는다. 관계가 누적되면 설정된 최대치까지 자연스럽게 올라갈 수 있다.':'- 현재는 성인 관계 표현이 해금된 구간이다. 선택한 문체 상한과 캐릭터에 맞춰 설정 최대치 안에서 사용한다.'}
- 욕설 강도: ${Number(state.profanity||0)}/100.${Number(state.profanity||0)>=10?' 감탄형/혼잣말 욕설은 캐릭터에 맞을 때 허용한다.':' 욕설은 거의 사용하지 않는다.'}
- 상대 비하형 욕설: ${state.insultMode==='off'?'금지. 성별 비하형 멸칭으로 상대를 부르지 않는다.':state.insultMode==='light'?'아주 약하게만 사용하고 성별 비하형 멸칭은 쓰지 않는다.':'사용자의 HARD CANON 지시를 우선한다.'}
- 사용자가 직접 허용한 성인용 직접 어휘: ${allowed.length?allowed.join(', '):'없음'}. 허용된 어휘도 현재 관계 단계가 해금된 뒤, 장면에 실제로 필요할 때만 사용한다.
- 선택하지 않은 직접 어휘는 사용하지 않는다. 선택하지 않은 단어를 금지 목록으로 다시 나열하지 않는다.
- 더티톡 강도와 욕설 강도는 서로 독립적으로 적용한다.`;
  }

  function canonDirective(){
    const beats=storylineBeats();
    const rawIdx=Math.max(0,Number(state.beatIndex||0));
    const completed=beats.length>0&&rawIdx>=beats.length;
    const idx=Math.min(rawIdx,Math.max(0,beats.length-1));
    const current=completed?'':(beats[idx]||'');
    const future=completed?[]:beats.slice(idx+1);
    const dynamicLabels=(state.dynamics||[]).map(id=>(DYNAMICS.find(x=>x[0]===id)||['',id])[1]).filter(Boolean);
    return `
[HARD CANON — 최우선. 임의 변경 금지]
- 세계관: ${worldLabel()}.
- 현재 관계: ${relationshipLabel()}.
- 관계 변화 방향: ${trajectoryLabel()}.
${dynamicLabels.length?`- 추가 관계 다이내믹: ${dynamicLabels.join(', ')}.`:''}
- A: ${state.occupationA} / 신분 ${socialLabel(state.socialA)}.
- B: ${state.occupationB} / 신분 ${socialLabel(state.socialB)}.
${state.militaryStatus?`- 군 관련 현재 상태: ${state.militaryStatus}.`:''}
${state.hardCanon?`- 사용자 잠금 설정:\n${state.hardCanon}`:'- 사용자 추가 잠금 설정 없음.'}
- 위 이름/나이/가족/출신/직업/신분/과거관계/첫 만남/호칭/이미 밝혀진 사실은 사용자가 명시적으로 바꾸지 않는 한 반전 소재로도 변경하지 않는다.
- “소꿉친구였다가 갑자기 재벌 도련님/왕족/귀족이었다” 같은 설정 추가를 금지한다. 단, HARD CANON에 그 반전이 처음부터 적힌 경우만 허용한다.
${beats.length?(completed?`\n[CANON STORYLINE LOCK]\n- 사용자가 지정한 ${beats.length}개 단계는 모두 완료됐다. 완료된 단계를 처음처럼 되풀이하지 말고, 기존 캐논과 관계 상태를 유지한 채 자연스러운 후속 아크만 전개한다.`:`\n[CANON STORYLINE LOCK]\n현재 진행 가능한 단계 ${idx+1}/${beats.length}: ${current}\n- 이 단계는 여러 화로 충분히 늘려도 된다.\n- 현재 단계가 실제로 완료되기 전에는 다음 단계로 넘어가지 않는다.\n- 선행/건너뛰기/순서변경 금지.\n${future.length?`아직 금지된 미래 단계:\n${future.map((b,i)=>`${idx+i+2}. ${b}`).join('\\n')}`:'현재가 마지막 단계다.'}`):''}`;
  }

  function historicalDirective(){
    const periodWorld=['historical_korea','historical_west','historical_real','eastern_fantasy','western_fantasy','martial_arts'].includes(state.world);
    if(!periodWorld) return '';
    const realHistory=state.world==='historical_real';
    const fictionalPeriod=['eastern_fantasy','western_fantasy'].includes(state.world);
    return `
[시대/지역 문체 프리셋]
- ${histStyleLabel()}.
${state.periodNote?`- 사용자 시대/지역 메모: ${state.periodNote}.`:''}
- 특정 작가의 문장을 복제하거나 고유 표현을 흉내 내지 않는다.
- 대신 시대에 맞는 어휘, 호칭, 예법, 신분 질서, 의복, 공간, 계절감, 격식 있는 대사와 운율을 활용한다.
- 현대 인터넷 말투와 현대 직장 문화를 시대물에 섞지 않는다.
${realHistory?'- 실존 역사물에서는 사용자가 지정하지 않은 실존 인물·사건·연도·제도를 확정 사실처럼 지어내지 않는다. 정확한 세부가 불확실하면 특정 사실 단정보다 시대 분위기와 생활상 중심으로 쓴다.':''}
${fictionalPeriod?'- 가상시대/로판에서는 실제 역사와 동일하다고 우기지 말고, 작품 안에서 정한 왕조·귀족제·호칭·계급 규칙을 처음부터 끝까지 일관되게 유지한다.':''}`;
  }

  function occupationDirective(){
    return `
[직업은 이름표가 아니라 사건 생성 장치]
- A의 ${state.occupationA}, B의 ${state.occupationB}가 실제 일정, 업무, 장소, 인간관계, 압박, 전문용어, 생활 리듬과 갈등에 영향을 줘야 한다.
- 작가/웹툰/크리에이터라면 마감, 콘티, 편집자/PD, 촬영, 업로드, 댓글/여론, 작업실 등 해당 직업의 현실적인 일상을 사건에 사용한다.
- 군인이라면 휴가·복귀·훈련·당직·연락 제약·파견·전역 등 군 생활 변수가 실제 플롯에 작동한다.
- 의료/법조/종교/공공 직군처럼 전문 윤리와 조직 규칙이 중요한 직업은 그 규칙을 사건의 현실적인 제약으로 사용하되 직업 전체를 고정관념 하나로 단순화하지 않는다.
- 직업을 1화 소개 뒤 잊어버리거나 다른 직업처럼 행동시키지 않는다.`;
  }

  function religionDirective(){
    const jobs=[state.occupationA,state.occupationB].filter(Boolean);
    const catholic=jobs.filter(x=>['가톨릭 신부','가톨릭 수도사','가톨릭 수녀'].includes(x));
    const protestant=jobs.filter(x=>['개신교 목사','개신교 전도사'].includes(x));
    const anglican=jobs.filter(x=>x==='성공회 사제');
    const buddhist=jobs.filter(x=>['불교 승려/스님','불교 비구니'].includes(x));
    const isReligious=state.world==='religious'||state.occCategoryA==='종교·성직·수행'||state.occCategoryB==='종교·성직·수행';
    if(!isReligious) return '';
    const manual={auto:'직업/종파 현실 기준',celibate:'사용자 선택: 독신·금욕 서약 있음',marriage_ok:'사용자 선택: 결혼/성생활 허용, 자동 파계 아님',community_only:'사용자 선택: 금욕보다 공동체·직업윤리/평판 갈등 중심',custom:'사용자 HARD CANON 직접 지정'}[state.religiousRule]||'직업/종파 현실 기준';
    const autoRules=state.religiousRule==='auto';
    return `
[종교·성직·수행 설정 — 직업별 규율을 구분]
- 현재 처리 방식: ${manual}.
${state.religiousNote?`- 사용자 종교/종파 메모: ${state.religiousNote}.`:''}
${autoRules&&catholic.length?`- ${catholic.join(', ')}: 가톨릭 독신 성직/수도 생활의 규율을 기본값으로 삼을 수 있다. 단, 사용자가 HARD CANON에서 예외나 다른 교파 설정을 주면 그 설정이 우선한다.`:''}
${autoRules&&protestant.length?`- ${protestant.join(', ')}: 결혼·자녀·부부생활이 가능한 직분이다. 성생활 자체를 금욕 위반이나 ‘파계’로 묘사하지 않는다. 갈등이 필요하면 기혼 여부, 목회 윤리, 공동체 평판, 신도와의 경계 같은 별도 설정에서 만든다.`:''}
${autoRules&&anglican.length?`- 성공회 사제: 결혼 가능성을 전제로 할 수 있으므로 자동으로 가톨릭식 독신/금욕 규율을 붙이지 않는다.`:''}
${autoRules&&buddhist.length?`- ${buddhist.join(', ')}: 종단·전통별 규율 차이를 무시하지 않는다. 사용자가 종단을 지정하지 않았다면 특정 종단의 금욕 규율을 사실처럼 단정하지 말고, 작품 안에서 선택한 수행 규율을 일관되게 유지한다.`:''}
- ‘성직자/수행자 × 성인 신도’ 관계는 성적 금기 하나로 단순화하지 않는다. 신앙, 상담/지도 역할, 공동체 시선, 직업윤리와 개인 감정을 분리해 서사화한다.
- 모든 인물은 성인이며 권위·직업적 영향력을 이용한 강압을 로맨스로 미화하지 않는다.`;
  }

  function conceptDirective(){
    const ds=new Set(state.dynamics||[]);
    const pregnancyAllowed=ds.has('pregnancy_change') || /임신|속도위반/.test(String(state.hardCanon||''));
    const reverseHarem=ds.has('reverse_harem');
    return `
[CONCEPT-SPECIFIC CONSISTENCY]
${state.world==='dimension_travel'||ds.has('dimension_cross')?'- 차원이동/이세계: 출발 세계와 도착 세계의 규칙, 귀환 가능 여부, 주인공이 알고 있는 정보를 구분하고 에피소드마다 임의로 바꾸지 않는다.':''}
${state.world==='reincarnation'||ds.has('past_life')?'- 전생/환생: 전생의 인물과 현생의 인격·기억 범위를 구분한다. 과거 인연을 현재 캐릭터의 확정 기억처럼 무단 추가하지 않는다.':''}
${state.world==='game_possession'||ds.has('game_possession_dynamic')?'- 게임빙의: 게임의 퀘스트/스탯/공략 정보와 현실 감정을 구분하고, 이미 정한 게임 규칙을 편의상 뒤집지 않는다.':''}
${state.world==='inhuman'||ds.has('nonhuman_romance')?'- 인외/초월적 존재: 종족 특성, 수명, 감각, 능력, 약점과 인간 사회에서의 정체를 HARD CANON처럼 일관되게 유지한다.':''}
${state.world==='omegaverse_mf'||ds.has('omega_rules')?'- 오메가버스: 모든 인물은 성인 남녀이며, 2차 성별·주기·향·사회 규칙은 작품 초기에 정한 설정만 사용한다. 규칙을 장면 편의를 위해 즉석에서 추가하지 않는다.':''}
${reverseHarem?'- 역하렘: 한 성인 여성 주인공과 복수의 성인 남성 후보 관계를 구분해 추적한다. 후보들의 성격/관계/진전도를 서로 복사하지 말고, 최종 선택 여부는 사용자 스토리라인을 우선한다.':''}
${ds.has('identity_disguise')?'- 남장/신분위장: 실제 정체, 각 인물이 현재 알고 있는 정체, 발각 시점을 별도로 추적하고 조기 폭로나 설정 망각을 금지한다.':''}
${ds.has('family_inlaw')?'- 가족/시가 갈등: 연애의 모든 갈등을 가족 악역 하나로 몰지 말고, 독립·경계·생활 방식·가치관 충돌처럼 현실적인 원인을 분리한다.':''}
${pregnancyAllowed?'- 임신/속도위반 관계 변화가 선택되어 있다. 임신 여부·시점·누가 알고 있는지·관계 변화는 타임라인에 고정해 앞뒤가 바뀌지 않게 한다.':'- 임신/출산은 현재 선택된 컨셉이 아니다. 사용자가 HARD CANON이나 현재 지시에서 명시하지 않는 한 임신·출산을 관계 전개 장치로 새로 만들지 않는다.'}
- 아이나 가족 구성원을 두 주인공을 억지로 연결하는 편의적 장치로 자동 생성하지 않는다.`;
  }

  function establishedSexualRelationship(){
    return ['fwb','fwb_repeat','physical_only','dating','longtime_lovers','married'].includes(state.relationship) && /(?:성적 관계|육체적 관계|섹파|FWB|이미 관계)/i.test(String(state.hardCanon||'')) || ['fwb','fwb_repeat','physical_only'].includes(state.relationship);
  }

  function isNewOrUndefinedRelationship(){
    return ['strangers','acquaintance','friend_of_friend','coworkers','senior_junior','boss_sub','blind_date','one_night','undefined','religious_guidance','religious_lay'].includes(state.relationship);
  }

  function isProfessionalBoundaryContext(){
    if(state.professionalBoundary===false) return false;
    if(['boss_sub','religious_guidance'].includes(state.relationship)) return true;
    const jobs=[state.occupationA,state.occupationB].join(' ');
    return /(PT|트레이너|필라테스|요가|의사|간호|치료사|임상|교수|강사|교사|신부|목사|전도사|사제|승려|스님|비구니|경호|팀닥터)/.test(jobs);
  }

  function expressionMilestones(){
    const adult=Math.max(1,unlockEpisode());
    if(state.sexualDialogueMode==='custom'){
      let flirt=Math.max(1,Number(state.flirtUnlockEpisode||Math.max(2,Math.round(adult*.58))));
      let explicit=Math.max(flirt,Number(state.explicitTalkUnlockEpisode||adult));
      return {adult, flirt, explicit};
    }
    // EP12 기준: EP1-3 내적 의식, 4-6 관심/비성적 장난, 7-11 로맨틱 플러팅, EP12+ 직접 성적 언어/더티톡.
    const flirt=Math.max(2,Math.min(adult,Math.floor(adult/2)+1));
    const explicit=adult;
    return {adult,flirt,explicit};
  }

  function expressionGate(ep){
    const m=expressionMilestones();
    if(establishedSexualRelationship()) return {allowedLevel:4,label:'기존에 성적 관계가 확정된 관계 · 현재 캐논 우선',...m};
    const awarenessEnd=Math.max(1,Math.floor(m.flirt/2));
    if(ep<=awarenessEnd) return {allowedLevel:0,label:'내적 끌림/신경 쓰임만 · 외부 플러팅 금지',...m};
    if(ep<m.flirt) return {allowedLevel:1,label:'개인적 관심·비성적 장난만 · 성적 언어 금지',...m};
    if(ep<m.explicit) return {allowedLevel:2,label:'로맨틱 플러팅 가능 · 성적 신체반응 지적/더티톡 금지',...m};
    if(ep<m.adult) return {allowedLevel:3,label:'욕망 자각은 가능 · 실제 성인 장면/노골적 더티톡은 아직 잠금',...m};
    return {allowedLevel:4,label:'성인 관계 및 설정된 더티톡 최대치 사용 가능',...m};
  }

  function desireExpressionDirective(ep){
    const gate=expressionGate(ep);
    const fresh=isNewOrUndefinedRelationship();
    const professional=isProfessionalBoundaryContext();
    const possessive=(state.dynamics||[]).includes('possessive');
    return `
[DESIRE ≠ EXPRESSION · 슬로우번 표현 게이트]
- 현재 EP.${ep}, 외부 성적 대사 허용 ${gate.allowedLevel}/4: ${gate.label}.
- 욕망의 발생, 욕망의 자각, 상대에게 표현, 실제 행동은 서로 다른 단계다. 한 화에서 한꺼번에 연결하지 않는다.
- 초기 끌림은 시선이 자꾸 감, 예상보다 신경 쓰임, 업무 후에도 떠오름, 순간적인 신체 반응을 본인이 숨김 같은 ‘내부 축적’으로 처리할 수 있다.
- 신체 반응이 생겼다는 이유만으로 캐릭터가 즉시 “내가 이 사람을 원한다”고 확신하거나, 상대에게 성적으로 말하거나, 소유권을 주장하지 않는다.
${fresh?'- 현재 관계가 초면/초기/정의되지 않은 축에 가깝다. 서로에 대해 모르는 정보가 많다는 사실 자체를 캐논으로 취급하고, 첫 만남의 강한 끌림을 깊은 집착·독점욕·성적 친밀감으로 점프시키지 않는다.':''}
${gate.allowedLevel<=1?'- 상대의 사적인 신체 반응을 직접 지적하거나 품평하지 않는다. 성적 농담·명령·직접적인 욕망 고백도 아직 사용하지 않는다.':''}
${gate.allowedLevel===2?'- 플러팅은 중의적·로맨틱 수준까지만 허용한다. 사적인 신체 반응의 직접 언급이나 노골적인 성적 대사는 아직 사용하지 않는다.':''}
${professional?'- PROFESSIONAL BOUNDARY: 업무상 시선·포즈 지시·자세 교정·치료·상담·교육·경호·권한 관계에서 생기는 접촉은 친밀한 접근에 대한 허가가 아니다. 초반에는 직업적으로 행동하고, 끌림이 생겨도 숨기거나 거리를 조절한다.':''}
${possessive&&state.possessiveLateReveal!==false?'- 집착/소유욕 트로프는 “첫 등장부터 상대를 내 것처럼 대함”이 아니라 관계가 누적된 뒤 드러나는 성향이다. 초반에는 과도하게 신경 쓰임·이유 모를 불편함·질투의 싹 정도로만 표현하고 소유권 언어/통제 행동은 선행하지 않는다.':''}
- 목표는 성적 긴장감을 죽이는 것이 아니다. 긴장감은 높게 유지할 수 있지만, 행동과 대사는 관계 단계보다 앞서지 않는다.`;
  }

  function quotedDialogue(text){
    const t=String(text||'');
    const chunks=[];
    const regs=[/[“\"]([^”\"]{1,240})[”\"]/g,/[‘']([^’']{1,240})[’']/g,/「([^」]{1,240})」/g];
    for(const r of regs){ let m; while((m=r.exec(t))) chunks.push(m[1]); }
    return chunks.join('\n');
  }

  function textExpressionViolation(text,ep){
    const gate=expressionGate(ep);
    if(gate.allowedLevel>=4) return '';
    const q=quotedDialogue(text);
    if(!q) return '';
    const explicitBody=/(보지|자지|좆|좆물|젖통|젖었|젖으|발기|흥분했|흥분하|아래가\s*(?:젖|달아|뜨거)|몸이\s*반응)/i;
    const explicitAction=/(박히|박아|박고\s*싶|빨아|핥아|싸게|싸줄|발정|먹어\s*줄|먹고\s*싶)/i;
    if(gate.allowedLevel<=2 && (explicitBody.test(q)||explicitAction.test(q))) return '현재 관계 단계보다 노골적인 성적 대사/신체반응 지적이 먼저 나왔다. 직접적인 성적 표현을 제거하고 긴장감은 시선·거리·내적 반응·절제된 플러팅으로 바꿀 것.';
    if(gate.allowedLevel===0 && /(내\s*거|내\s*여자|내\s*남자|갖고\s*싶|가지고\s*싶)/i.test(q)) return '초기 관계에서 소유권/독점 언어가 너무 빨리 외부화됐다. 관심과 낯선 끌림 수준으로 낮출 것.';
    return '';
  }

  function postUnlockPaceLabel(){
    return ({steady:'천천히 유지',natural:'자연스럽게 적극화',active:'적극적',custom:'CUSTOM'})[state.postUnlockPace]||'자연스럽게 적극화';
  }

  function postUnlockTargetInterval(){
    const cooldownMin=Math.max(1,Number(state.cooldown||0)+1);
    if(state.postUnlockPace==='custom') return Math.max(cooldownMin,Math.max(1,Number(state.postUnlockInterval||3)));
    const base={rare:8,sparse:6,balanced:4,frequent:3,very_frequent:2}[state.adultFrequency]||6;
    if(state.postUnlockPace==='steady') return Math.max(cooldownMin,base+2);
    if(state.postUnlockPace==='active') return Math.max(cooldownMin,base-1);
    return Math.max(cooldownMin,base);
  }

  function postUnlockInitialDelay(){
    const base={rare:4,sparse:2,balanced:1,frequent:0,very_frequent:0}[state.adultFrequency]??2;
    if(state.postUnlockPace==='steady') return base+2;
    if(state.postUnlockPace==='active') return Math.max(0,base-1);
    if(state.postUnlockPace==='custom') return Math.max(0,Math.min(3,Number(state.postUnlockInterval||3)-1));
    return base;
  }

  function postUnlockState(ep){
    const unlock=unlockEpisode();
    const last=Number(state.runtime.lastAdultEpisode||0);
    const cooldown=Math.max(0,Number(state.cooldown||0));
    const target=postUnlockTargetInterval();
    const initialDelay=postUnlockInitialDelay();
    const unlocked=ep>=unlock || establishedSexualRelationship();
    const cooldownLocked=last>0 && ep<=last+cooldown;
    const dueFirst=unlocked && !last && ep>=unlock+initialDelay;
    const dueRepeat=unlocked && last>0 && (ep-last)>=target;
    const due=!cooldownLocked && (dueFirst||dueRepeat);
    const overdue=!cooldownLocked && (last>0 ? (ep-last)>=target+2 : unlocked && ep>=unlock+initialDelay+2);
    return {unlock,last,cooldown,target,initialDelay,unlocked,cooldownLocked,due,overdue};
  }

  function postUnlockPaceDirective(ep){
    const ps=postUnlockState(ep);
    if(!ps.unlocked) return `
[POST-UNLOCK RELATIONSHIP PACE]
- 현재는 첫 성인 관계 해금 전이다. 기존 슬로우번 게이트를 우선한다.`;
    const detail=currentIntensityMode().id;
    const detailRule=detail==='R15_TENSION'
      ? '현재 R-15는 장면의 존재를 금지하는 모드가 아니라 표현 상세도의 상한이다. 관계가 성인 단계로 진전될 수는 있지만 묘사는 비노골적·감정 중심으로 처리한다.'
      : '현재 R-19 문체 상한은 해금된 장면의 상세도를 결정한다. 장면의 존재 여부와 빈도는 아래 관계 페이스/빈도 설정을 따른다.';
    return `
[POST-UNLOCK RELATIONSHIP PACE — 해금 뒤 정체 방지]
- 현재 모드: ${postUnlockPaceLabel()}. 성인 장면 빈도 ${state.adultFrequency}, 목표 간격 약 ${ps.target}화, 쿨다운 ${ps.cooldown}화.
- SLOW/ULTRA SLOW는 첫 관계까지의 축적 속도다. 해금 이후에도 영구적으로 신체적 관계를 미루라는 뜻이 아니다.
- ${detailRule}
${ps.cooldownLocked?`- 현재는 쿨다운 중이므로 새 성인 장면을 억지로 넣지 않는다.`:ps.due?'- 현재는 해금 후 관계 진전이 필요한 구간이다. HARD CANON/현재 스토리라인과 충돌하지 않는 한 이번 화에서 실질적인 신체적 친밀도 변화나 성인 관계 진전을 발생시킨다. 촬영·업무·운동·식사 대화만 반복하며 다시 미루지 않는다.':'- 현재는 반드시 성인 장면을 넣어야 하는 화는 아니다. 다만 해금된 관계를 초반 상태로 되돌리지 말고 이미 쌓인 친밀도는 유지한다.'}
- 성인 장면을 넣더라도 최근 장소/구도/시작 계기/감정 목적을 복사하지 않는다.
- 장면 빈도와 묘사 수위는 별개다. R-15를 선택했다고 관계 진전 자체를 20~30화씩 회피하지 않는다.`;
  }

  function pacingDirective(ep){
    const unlock=unlockEpisode();
    const gate=expressionGate(ep);
    const last=Number(state.runtime.lastAdultEpisode||0); const cool=Number(state.cooldown||0);
    const cooldownLocked=last>0 && ep<=last+cool;
    const frequencyText={rare:'매우 적음. 중요한 감정/서사 전환점에서만',sparse:'적음. 충분한 긴장 축적 후 선택적으로',balanced:'보통. 서사 균형을 해치지 않는 범위',frequent:'많음. 다만 반복과 무의미한 삽입 금지',very_frequent:'매우 많음. 그래도 매 화 자동 삽입 금지'}[state.adultFrequency]||'적음';
    return `
[PACING STATE MACHINE]
- 현재 EP.${ep}. 첫 성인 장면 최소 해제 기준: EP.${unlock}.
- 현재 외부 성적 대사 게이트: ${gate.allowedLevel}/4 (${gate.label}).
- EP.${unlock} 이전에는 사용자가 처음부터 이미 성적 관계인 설정을 고른 경우를 제외하고 성인 장면으로 급가속하지 않는다. EP.${unlock} 이후에는 위 POST-UNLOCK PACE + REFUSAL HOTFIX가 우선하며, SLOW라는 이유만으로 관계 진전을 계속 연기하지 않는다.
- 관계는 ‘끌림 발생 → 반복해서 의식 → 스스로 자각 → 상대의 반응 탐색 → 표현 → 관계 선택 → 신체적 진전’ 순으로 누적한다. 몸의 반응 하나만으로 뒤 단계를 자동 실행하지 않는다.
- 한 화에서 끌림·자각·질투·고백·소유욕·성적 대사·신체 관계를 연쇄적으로 몰아넣지 않는다.
- 성인 장면 빈도: ${frequencyText}.
${cooldownLocked?`- 쿨다운 잠금: 최근 성인 장면이 EP.${last}. EP.${last+cool}까지는 감정 후폭풍/생활 변화/사건/갈등/친밀감 재축적을 우선하며 새 성인 장면을 넣지 않는다.`:'- 현재 쿨다운에 의해 자동 금지된 상태는 아니다. 그래도 서사적 필요가 있을 때만 사용한다.'}
- 성인 장면 뒤에는 감정 후폭풍, 일상 변화, 다음 사건을 반드시 남긴다. “씬 → 다음 화 또 씬”의 기계적 반복을 피한다.`;
  }

  function continuityDirective(){
    const timeline=state.runtime.timeline.slice(-24); const threads=state.runtime.openThreads.slice(-MAX_THREADS); const scenes=state.runtime.scenes.slice(-Math.max(3,Number(state.varietyWindow||5)));
    return `
[LONGFORM MEMORY — EP15 이후에도 유지]
${timeline.length?`확정 타임라인:\n${timeline.map((x,i)=>`- ${x}`).join('\n')}`:'확정 타임라인: 아직 없음.'}
${state.runtime.relationshipState?`현재 관계 상태: ${state.runtime.relationshipState}`:'현재 관계 상태: 초기값.'}
${threads.length?`미회수 복선/약속/갈등:\n${threads.map(x=>`- ${x}`).join('\n')}`:'미회수 복선/약속/갈등: 없음.'}
${scenes.length?`최근 장면 지문:\n${scenes.map(s=>`- EP${s.episode||'?'} | 장소 ${s.location||'?'} | 목적 ${s.purpose||'?'} | 친밀구도 ${s.pattern||'없음'} | 엔딩 ${s.ending||'?'}`).join('\n')}`:'최근 장면 지문: 없음.'}
- 이미 해결된 사건을 새 사건처럼 재사용하지 않는다.
- 최근 에피소드와 장소/대화주제/갈등/접촉/엔딩 방식이 겹치면 새 조합으로 바꾼다.
- “술/집/묘한 분위기/직전에서 끊기” 같은 동일 구조를 이름만 바꿔 반복하지 않는다.`;
  }

  function varietyDirective(){
    const allowed=INTIMACY_PATTERNS.filter(([id])=>state.intimacyPatterns.includes(id)).map(x=>x[1]);
    const recent=state.runtime.scenes.slice(-Math.max(1,Number(state.varietyWindow||5))).map(s=>s.pattern).filter(Boolean);
    return `
[성인 장면 다양성]
- 다양성: ${state.variety==='max'?'매우 높음':state.variety==='high'?'높음':'보통'}.
- 허용 구도 풀: ${allowed.length?allowed.join(', '):'사용자 별도 지정 없음'}.
- 최근 사용 구도: ${recent.length?recent.join(', '):'기록 없음'}.
- 최근 ${Number(state.varietyWindow||5)}회와 같은 핵심 구도/시작 계기/장소/주도권/대화 패턴을 그대로 반복하지 않는다.
- 무작위 체위 전시처럼 보이게 하지 말고 현재 장소, 성격, 감정선에 자연스럽게 맞는 다른 구도를 선택한다.
- 사용자가 특정 구도를 직접 지시하면 그 지시가 최우선이다.`;
  }

  function episodePurposeDirective(){
    return `
[EPISODE PURPOSE]
- 이번 화의 핵심 기능을 정확히 하나 정한다: 새로운 정보 공개 / 오해 확대 / 태도 변화 / 의심 / 관계 한 단계 진전 / 외부 사건 / 복선 회수 / 갈등 생성 / 갈등 해결 / 일상 침범 중 가장 필요한 것.
- 직전 3~5화와 같은 기능만 반복하지 않는다.
- 매 화 관계를 무조건 진전시키지 않아도 되지만, 사건·정보·선택·관계 중 최소 하나는 새로워져야 한다.`;
  }

  function retryDirective(){
    const r=state.runtime.retryDirective||'';
    return r?`\n[자동 재검토 후 재생성 지시]\n${r}\n- 이전 실패본의 장면과 문장을 복사하지 말고 위 오류를 수정해 다시 쓴다.`:'';
  }

  function metadataDirective(){
    return `
[출력 끝의 머신 메타 — 본문과 분리해 반드시 1회만 추가]
본문이 끝난 뒤 정확히 아래 형식의 JSON을 추가한다. 코드블록은 쓰지 않는다.
[[VELOUR_V4_META]]{"beatComplete":false,"canonViolation":false,"storylineSkipped":false,"repeatRisk":"low","adultScene":false,"sexualDialogueLevel":0,"expressionViolation":false,"professionalBoundaryViolation":false,"timeline":"이번 화에서 새로 확정된 사실 1문장","openThreads":["남은 복선/약속/갈등"],"closedThreads":["이번 화에서 회수한 항목"],"location":"대표 장소","purpose":"이번 화 핵심 기능","pattern":"성인 장면이 있으면 핵심 구도, 없으면 none","ending":"엔딩 방식","relationshipState":"현재 관계 상태 한 문장"}[[/VELOUR_V4_META]]
- canonViolation/storylineSkipped/expressionViolation/professionalBoundaryViolation는 자기검수 결과 실제 문제가 있을 때만 true.
- sexualDialogueLevel: 0=없음, 1=개인적 관심/비성적 장난, 2=로맨틱 플러팅, 3=직접적 성적 암시, 4=성인용 직접 대사.
- beatComplete는 현재 CANON STORYLINE 단계가 정말 완료됐을 때만 true.
- 메타는 앱에서 자동 제거되므로 독자에게 설명하지 않는다.`;
  }

  function currentIntensityMode(){
    const raw=String(document.getElementById('selectIntensity')?.value||'');
    if(/R-19\s*Direct|직접적 감각|숨김없는/i.test(raw)) return {id:'R19_DIRECT',label:'R-19 Direct · 해금된 성인 장면에서 직접적이고 명료한 성인 문체'};
    if(/R-19\s*Literary|고밀도 감각|호흡, 체온/i.test(raw)) return {id:'R19_LITERARY',label:'R-19 Literary · 해금된 성인 장면에서 감각과 정서 밀도를 높인 문체'};
    return {id:'R15_TENSION',label:'R-15 · 텐션과 감정선 중심'};
  }

  function cleanLegacyPrompt(text){
    let out=String(text||'');
    const mode=currentIntensityMode();
    // V4가 따로 관리하는 옛 stage 문장은 중복·과잉 지시가 되므로 제거한다.
    out=out.replace(/^\s*- 이번 화 서사 단계:.*$/gm,'');
    out=out.replace(/^\s*1\. 이번 화 서사 단계.*$/gm,'');
    // 원본 UI의 장문 수위 설명 대신 짧은 스타일 상한만 전달한다. 출력 가능 범위를 낮추는 변경이 아니다.
    out=out.replace(/^\s*- 묘사 톤 및 수위:.*$/gm,`- 문체/수위 상한: ${mode.label}`);
    out=out.replace(/^\s*3\. 시각, 청각, 촉각.*$/gm,'3. 감각 묘사는 장면의 감정과 분위기를 강화하는 범위에서 구체적으로 쓴다.');
    return out.replace(/\n{3,}/g,'\n\n').trim();
  }

  const previousBuild=window.buildPrompt;
  if(typeof previousBuild==='function'){
    window.buildPrompt=function(isContinue=false){
      const base=cleanLegacyPrompt(legacyActiveTagsSuppressed(()=>previousBuild(isContinue))); const ep=epNumber();
      return `${base}\n\n===== VELOUR STORY ENGINE V4.4.6 · POST-UNLOCK PACE + REFUSAL HOTFIX OVERRIDE =====
[우선순위] 사용자 현재 입력 > V4.4.6 HARD CANON/스토리라인 잠금 > V4.4.6 외형·장기 메모리 > 기존 자동 디렉터.
- 위쪽 기존 프롬프트에 남아 있을 수 있는 옛 ‘배경 세계관/서사 단계/관계성/2~4화 페이싱’ 값은 레거시 호환 정보일 뿐이다. 충돌하면 아래 V4.4.6 값만 따른다.
- 기존 V3.5 관계 태그는 V4.4.6 관계축과 중복되므로 이번 프롬프트에서는 비활성화했다.
모든 인물은 명백한 성인(21세 이상)이며 친밀한 관계는 상호 선택과 동의가 분명한 상황에서만 진행한다.
[현재 문체 상한] ${currentIntensityMode().label}. 이 선택은 자동으로 R-15로 강등하지 않는다. 이 값은 묘사 상세도의 상한이며 성인 관계 장면의 존재/빈도와는 별개다. 실제 표현 시점은 페이싱 게이트가 결정한다.
${canonDirective()}
${historicalDirective()}
${occupationDirective()}
${appearanceDirective()}
${religionDirective()}
${conceptDirective()}
${desireExpressionDirective(ep)}
${postUnlockPaceDirective(ep)}
${pacingDirective(ep)}
${continuityDirective()}
${episodePurposeDirective()}
${varietyDirective()}
${languageDirective(ep)}
${retryDirective()}
${metadataDirective()}
===== END VELOUR V4.4.6 =====`;
    };
  }

  function installGeminiDiagnostic(){
    if(window.__VELOUR_V444_FETCH_DIAGNOSTIC__) return;
    window.__VELOUR_V444_FETCH_DIAGNOSTIC__=true;
    const priorFetch=window.fetch?.bind(window);
    if(typeof priorFetch!=='function') return;
    window.fetch=async function(input,init){
      const url=typeof input==='string'?input:(input?.url||'');
      const isGemini=/generativelanguage\.googleapis\.com\/.*:generateContent/i.test(url);
      const res=await priorFetch(input,init);
      if(isGemini){
        try{
          const data=await res.clone().json();
          const c=data?.candidates?.[0]||{};
          window.__VELOUR_LAST_GEMINI_DIAGNOSTIC__={
            promptBlock:String(data?.promptFeedback?.blockReason||''),
            finishReason:String(c?.finishReason||''),
            hasCandidate:!!data?.candidates?.length,
            at:Date.now()
          };
        }catch(e){ window.__VELOUR_LAST_GEMINI_DIAGNOSTIC__={parseError:true,at:Date.now()}; }
      }
      return res;
    };
  }

  function isLikelyModelRefusal(text){
    const t=String(text||'').trim();
    if(!t || t.length>1600) return false;
    const refusal=/(진행할 수 없(?:습니다|어요)?|생성(?:이)? 불가능|생성할 수 없(?:습니다|어요)?|작성할 수 없(?:습니다|어요)?|제공할 수 없(?:습니다|어요)?|도와드릴 수 없(?:습니다|어요)?|지원하지 않(?:습니다|아요)?|지원할 수 없(?:습니다|어요)?|허용되지 않(?:습니다|아요)?|요청을 수행할 수 없(?:습니다|어요)?|응답할 수 없(?:습니다|어요)?|요청하신 .*진행할 수 없|I (?:can(?:not|'t)|am unable to) (?:help|assist|provide|generate|write))/i;
    const context=/(성적|노골적|신체 부위|콘텐츠|지침|정책|sexual|explicit|policy|guideline)/i;
    return refusal.test(t) && context.test(t);
  }

  function generationFailureKind(text){
    const d=window.__VELOUR_LAST_GEMINI_DIAGNOSTIC__||{};
    if(d.promptBlock || String(d.finishReason).toUpperCase()==='SAFETY') return {kind:'API_FILTER',detail:d.promptBlock||d.finishReason||'SAFETY'};
    if(isLikelyModelRefusal(text)) return {kind:'MODEL_REFUSAL',detail:'모델이 답변 본문으로 거절문을 생성함'};
    return null;
  }

  function showGenerationFailure(failure,attemptedEp){
    const el=document.getElementById('novelText');
    if(el){
      el.innerText=failure.kind==='API_FILTER'
        ? `⚠️ API FILTER BLOCK\n이번 요청이 API 안전 필터 단계에서 중단됐어.\nEP.${attemptedEp}는 확정하지 않았고 장기 메모리에도 반영하지 않았어.`
        : `⚠️ MODEL REFUSAL\n모델이 이번 요청을 답변 단계에서 거절했어.\n문체 모드는 변경하지 않았고 EP.${attemptedEp}는 확정하지 않았어. 같은 번호로 다시 시도할 수 있어.`;
    }
    const counter=document.getElementById('v35CharCount');
    if(counter) counter.textContent=failure.kind==='API_FILTER'?'API FILTER BLOCK · 미확정':'MODEL REFUSAL · 미확정';
  }

  installGeminiDiagnostic();

  function extractMeta(text){
    let meta=null;
    const clean=String(text||'').replace(META_RE,(all,json)=>{ if(!meta){ try{ meta=JSON.parse(json.trim()); }catch(e){} } return ''; }).trim();
    return {clean,meta};
  }

  function stripMetaEverywhere(){
    const el=document.getElementById('novelText');
    if(el){ const x=extractMeta(el.innerText||''); if(x.clean!==el.innerText) el.innerText=x.clean; }
    try { if(typeof storyHistory!=='undefined'&&storyHistory) storyHistory=String(storyHistory).replace(META_RE,'').trim(); } catch(e){}
  }

  function updateMemory(meta,ep){
    if(!meta||typeof meta!=='object')return;
    if(meta.timeline&&String(meta.timeline).trim()) state.runtime.timeline.push(`EP${ep}: ${String(meta.timeline).trim()}`);
    state.runtime.timeline=state.runtime.timeline.slice(-MAX_TIMELINE);
    const closed=new Set((meta.closedThreads||[]).map(String));
    state.runtime.openThreads=(state.runtime.openThreads||[]).filter(x=>!closed.has(String(x)));
    for(const t of (meta.openThreads||[])){ const s=String(t||'').trim(); if(s&&!state.runtime.openThreads.includes(s))state.runtime.openThreads.push(s); }
    state.runtime.openThreads=state.runtime.openThreads.slice(-MAX_THREADS);
    if(meta.relationshipState) state.runtime.relationshipState=String(meta.relationshipState).trim();
    state.runtime.scenes.push({episode:ep,location:String(meta.location||'').trim(),purpose:String(meta.purpose||'').trim(),pattern:String(meta.pattern||'none').trim(),ending:String(meta.ending||'').trim(),adultScene:!!meta.adultScene});
    state.runtime.scenes=state.runtime.scenes.slice(-MAX_SCENES);
    if(meta.adultScene) state.runtime.lastAdultEpisode=ep;
    if(meta.beatComplete){ const beats=storylineBeats(); if(beats.length) state.beatIndex=Math.min(beats.length,Number(state.beatIndex||0)+1); }
    save(state); syncUI(false);
  }

  function patchDraft(){
    try{ const d=safeParse(localStorage.getItem(DRAFT_KEY)||'null',null); if(!d)return; d.v4State=clone(state); if(d.currentText)d.currentText=String(d.currentText).replace(META_RE,'').trim(); if(d.storyHistory)d.storyHistory=String(d.storyHistory).replace(META_RE,'').trim(); if(Array.isArray(d.episodes)) d.episodes=d.episodes.map(ep=>Object.assign({},ep,{text:String(ep.text||'').replace(META_RE,'').trim()})); localStorage.setItem(DRAFT_KEY,JSON.stringify(d)); }catch(e){}
  }

  function retryReason(meta,text,ep){
    const reasons=[];
    if(meta?.canonViolation)reasons.push('HARD CANON을 위반했다. 캐릭터 신분·직업·과거·호칭을 원래 설정으로 복구할 것.');
    if(meta?.storylineSkipped)reasons.push('CANON STORYLINE의 현재 단계를 건너뛰었다. 미래 단계 사건을 제거하고 현재 단계만 진행할 것.');
    if(String(meta?.repeatRisk||'').toLowerCase()==='high')reasons.push('최근 장면과 구조적 반복이 높다. 장소/목적/갈등/엔딩/친밀 구도를 바꿀 것.');
    const gate=expressionGate(ep);
    if(meta?.expressionViolation) reasons.push(`현재 EP.${ep}의 성적 대사 허용 단계(${gate.allowedLevel}/4)를 넘었다. 욕망은 내부 축적으로 되돌리고 대사/행동의 선행 진전을 제거할 것.`);
    if(meta?.professionalBoundaryViolation) reasons.push('직업상 접촉이나 권한 관계를 성적 허가처럼 처리했다. 직업적 경계를 복구하고 끌림은 내면에서만 축적할 것.');
    if(Number(meta?.sexualDialogueLevel||0)>gate.allowedLevel) reasons.push(`성적 대사 레벨 ${Number(meta.sexualDialogueLevel)}이 현재 허용 ${gate.allowedLevel}보다 높다. 대사를 현재 단계 이하로 낮출 것.`);
    const textReason=textExpressionViolation(text,ep); if(textReason) reasons.push(textReason);
    return [...new Set(reasons)].join('\n');
  }

  const previousGenerate=window.generateStory;
  if(typeof previousGenerate==='function'){
    window.generateStory=async function(isContinue=false){
      const beforeEpisode=(()=>{try{return Number(episodeCount||1)}catch(e){return 1}})();
      const beforeHistory=(()=>{try{return String(storyHistory||'')}catch(e){return ''}})();
      if(!isContinue){ resetRuntime(); }
      state.runtime.retryDirective=''; state.runtime.retryCount=0; save(state);
      const userNext=(document.getElementById('v33Next')?.value||'').trim();
      window.__VELOUR_LAST_GEMINI_DIAGNOSTIC__=null;
      await previousGenerate(isContinue);
      let raw=document.getElementById('novelText')?.innerText||'';
      let parsed=extractMeta(raw); const ep=epNumber();
      const failure=generationFailureKind(parsed.clean||raw);
      if(failure){
        try{ episodeCount=isContinue?beforeEpisode:1; }catch(e){}
        try{ storyHistory=isContinue?beforeHistory:''; }catch(e){}
        state.runtime.retryDirective=''; state.runtime.retryCount=0; save(state);
        showGenerationFailure(failure,ep);
        syncUI(false);
        return;
      }
      if(parsed.clean&&document.getElementById('novelText'))document.getElementById('novelText').innerText=parsed.clean;
      stripMetaEverywhere();

      const reason=retryReason(parsed.meta,parsed.clean,ep);
      if(reason){
        // 페이싱 실패본은 장기 메모리에 기록하지 않는다. 재생성 결과만 확정한다.
        state.runtime.retryDirective=`${reason}${userNext?`\n사용자가 이번 화에 추가로 준 지시도 유지: ${userNext}`:''}`;
        state.runtime.retryCount=1; save(state);
        window.__VELOUR_LAST_GEMINI_DIAGNOSTIC__=null;
        await previousGenerate(isContinue);
        raw=document.getElementById('novelText')?.innerText||''; parsed=extractMeta(raw);
        const retryFailure=generationFailureKind(parsed.clean||raw);
        if(retryFailure){
          try{ episodeCount=isContinue?beforeEpisode:1; }catch(e){}
          try{ storyHistory=isContinue?beforeHistory:''; }catch(e){}
          state.runtime.retryDirective=''; state.runtime.retryCount=0; save(state);
          showGenerationFailure(retryFailure,epNumber()); syncUI(false); return;
        }
        if(parsed.clean&&document.getElementById('novelText'))document.getElementById('novelText').innerText=parsed.clean;
        stripMetaEverywhere();
        const secondEp=epNumber(); const secondReason=retryReason(parsed.meta,parsed.clean,secondEp);
        if(!secondReason){ updateMemory(parsed.meta,secondEp); } else { console.warn('VELOUR V4.4.4: retry still violated pacing; memory not committed', secondReason); }
        state.runtime.retryDirective=''; save(state); patchDraft(); syncUI(false);
      } else {
        updateMemory(parsed.meta,ep); patchDraft();
      }
    };
  }

  function wrapLibraryPersistence(){
    if(typeof window.saveCurrentStory==='function'&&!window.__VELOUR_V40_SAVE_WRAP__){
      window.__VELOUR_V40_SAVE_WRAP__=true; const old=window.saveCurrentStory;
      window.saveCurrentStory=function(){
        let before=[]; try{before=safeParse(localStorage.getItem(LIB_KEY)||'[]',[]).map(x=>String(x.id));}catch(e){}
        const out=old.apply(this,arguments);
        try{ const items=safeParse(localStorage.getItem(LIB_KEY)||'[]',[]); const fresh=items.find(x=>!before.includes(String(x.id))); if(fresh){fresh.v4State=clone(state); localStorage.setItem(LIB_KEY,JSON.stringify(items));} }catch(e){}
        return out;
      };
    }
    if(typeof window.restoreStory==='function'&&!window.__VELOUR_V40_RESTORE_WRAP__){
      window.__VELOUR_V40_RESTORE_WRAP__=true; const old=window.restoreStory;
      window.restoreStory=function(id){
        let item=null; try{item=safeParse(localStorage.getItem(LIB_KEY)||'[]',[]).find(x=>String(x.id)===String(id));}catch(e){}
        const out=old.apply(this,arguments); if(item?.v4State){state=Object.assign(clone(DEFAULT),item.v4State);state.terms=Object.assign({},DEFAULT.terms,item.v4State.terms||{});state.runtime=Object.assign({},DEFAULT.runtime,item.v4State.runtime||{});state.appearanceEnabled = item.v4State.appearanceEnabled !== false; state.appearance={female:Object.assign({},DEFAULT.appearance.female,((item.v4State.appearance||{}).female)||{}), male:Object.assign({},DEFAULT.appearance.male,((item.v4State.appearance||{}).male)||{})};state.dynamics=Array.isArray(item.v4State.dynamics)?item.v4State.dynamics:[];state.intimacyPatterns=Array.isArray(item.v4State.intimacyPatterns)?item.v4State.intimacyPatterns:clone(DEFAULT.intimacyPatterns);save(state);syncAppearanceToV33();syncUI();} return out;
      };
    }
    if(typeof window.restoreDraftStory==='function'&&!window.__VELOUR_V40_DRAFT_WRAP__){
      window.__VELOUR_V40_DRAFT_WRAP__=true; const old=window.restoreDraftStory;
      window.restoreDraftStory=function(){
        let d=null;try{d=safeParse(localStorage.getItem(DRAFT_KEY)||'null',null);}catch(e){}
        const out=old.apply(this,arguments);if(d?.v4State){state=Object.assign(clone(DEFAULT),d.v4State);state.terms=Object.assign({},DEFAULT.terms,d.v4State.terms||{});state.runtime=Object.assign({},DEFAULT.runtime,d.v4State.runtime||{});state.appearanceEnabled = d.v4State.appearanceEnabled !== false; state.appearance={female:Object.assign({},DEFAULT.appearance.female,((d.v4State.appearance||{}).female)||{}), male:Object.assign({},DEFAULT.appearance.male,((d.v4State.appearance||{}).male)||{})};state.dynamics=Array.isArray(d.v4State.dynamics)?d.v4State.dynamics:[];state.intimacyPatterns=Array.isArray(d.v4State.intimacyPatterns)?d.v4State.intimacyPatterns:clone(DEFAULT.intimacyPatterns);save(state);syncAppearanceToV33();syncUI();}return out;
      };
    }
  }

  installCss();
  installUI();
  wrapLibraryPersistence();
  patchDraft();
  console.info('✦ VELOUR Story Engine V4.4.6 Post-Unlock Pace loaded');
})();
