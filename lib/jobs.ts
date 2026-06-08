export type Duty = {
  id: string;
  title: string;
  text: string;
  hint: string;
  source?: "seed" | "custom";
};

export type Job = {
  name: string;
  icon: string;
  duties: Duty[];
};

export type JobKey = "hr" | "marketing" | "product" | "engineer" | "design";

export const jobsData: Record<JobKey, Job> = {
  hr: {
    name: "HR 人力资源",
    icon: "人",
    duties: [
      { id: "hr_recruit", title: "招聘与配置", text: "根据业务需求制定招聘计划，发布职位，筛选简历，组织面试，完成人才引进。", hint: "招聘专家" },
      { id: "hr_train", title: "培训与发展", text: "搭建培训体系，组织员工技能提升、领导力培养项目，规划职业发展路径。", hint: "培训与发展顾问" },
      { id: "hr_perf", title: "绩效管理", text: "设计并实施绩效考核方案（KPI/OKR），组织绩效评估，推动绩效改进计划。", hint: "绩效管理专家" },
      { id: "hr_culture", title: "企业文化与员工关系", text: "组织文化活动，处理员工入职/离职手续，劳动关系合规，员工关怀。", hint: "员工关系与文化专员" }
    ]
  },
  marketing: {
    name: "市场营销",
    icon: "市",
    duties: [
      { id: "mkt_strategy", title: "市场战略制定", text: "行业分析，竞品调研，目标市场定位，输出年度营销策略地图。", hint: "市场策略分析师" },
      { id: "mkt_brand", title: "品牌管理", text: "品牌定位、视觉体系规范，品牌传播战役策划，提升品牌美誉度。", hint: "品牌策划专家" },
      { id: "mkt_digital", title: "数字营销", text: "SEO/SEM 策略，社交媒体运营，广告投放优化。", hint: "数字营销运营" },
      { id: "mkt_activity", title: "活动策划执行", text: "线上/线下发布会，展会，用户增长活动，ROI 分析与复盘。", hint: "活动策划与执行" }
    ]
  },
  product: {
    name: "产品经理",
    icon: "产",
    duties: [
      { id: "pd_research", title: "用户调研与需求分析", text: "客户访谈，数据洞察，定义用户画像，输出需求文档。", hint: "用户洞察专家" },
      { id: "pd_roadmap", title: "产品规划与路线图", text: "版本迭代计划，功能优先级评估，roadmap 制定与同步。", hint: "产品路线图规划" },
      { id: "pd_design", title: "原型与交互设计", text: "输出低保真/高保真原型，撰写 PRD，协同设计团队落地。", hint: "交互与原型设计" },
      { id: "pd_metric", title: "数据分析与产品优化", text: "核心指标监控，A/B 测试方案，以数据驱动产品迭代。", hint: "产品数据增长" }
    ]
  },
  engineer: {
    name: "后端开发",
    icon: "后",
    duties: [
      { id: "eng_api", title: "API 设计与开发", text: "RESTful / GraphQL 接口，文档编写，高并发处理逻辑。", hint: "后端架构" },
      { id: "eng_db", title: "数据库设计", text: "表结构、索引优化、分库分表方案，数据迁移与备份策略。", hint: "数据库专家" },
      { id: "eng_perf", title: "性能优化", text: "服务调优，慢查询分析，缓存策略，系统瓶颈排查。", hint: "性能优化工程师" },
      { id: "eng_security", title: "安全与稳定性", text: "接口防刷，SQL 注入防范，日志监控，服务高可用设计。", hint: "系统安全与可靠性" }
    ]
  },
  design: {
    name: "UI/UX 设计",
    icon: "设",
    duties: [
      { id: "ui_visual", title: "视觉设计", text: "定义设计系统，组件库建设，高保真界面落地，品牌风格延展。", hint: "UI 视觉设计师" },
      { id: "ux_research", title: "用户体验研究", text: "用户旅程地图，可用性测试，竞品交互分析，提升易用性。", hint: "用户体验研究员" },
      { id: "proto_interact", title: "交互原型制作", text: "Figma/即时原型，动态微交互，输出交互说明文档。", hint: "交互设计专家" },
      { id: "design_collab", title: "设计协作与评审", text: "与产品/开发协作，走查还原度，迭代设计规范。", hint: "设计协作规范" }
    ]
  }
};

export const defaultJobKey: JobKey = "hr";
