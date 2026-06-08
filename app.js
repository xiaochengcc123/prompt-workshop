const jobsData = {
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

const storageKey = "prompt-workshop-favorites";

const state = {
    currentJobKey: "hr",
    currentDutyId: "",
    latestPrompt: "",
    latestTitle: "",
    searchTerm: "",
    favorites: loadFavorites()
};

const elements = {
    jobList: document.querySelector("#jobList"),
    dutiesList: document.querySelector("#dutiesList"),
    roleTitle: document.querySelector("#roleTitle"),
    searchInput: document.querySelector("#searchInput"),
    promptOutput: document.querySelector("#promptOutput"),
    promptMeta: document.querySelector("#promptMeta"),
    copyBtn: document.querySelector("#copyBtn"),
    favoriteBtn: document.querySelector("#favoriteBtn"),
    downloadBtn: document.querySelector("#downloadBtn"),
    toggleCustomBtn: document.querySelector("#toggleCustomBtn"),
    customForm: document.querySelector("#customForm"),
    customDutyTitle: document.querySelector("#customDutyTitle"),
    customDutyText: document.querySelector("#customDutyText"),
    favoritesList: document.querySelector("#favoritesList"),
    clearFavoritesBtn: document.querySelector("#clearFavoritesBtn"),
    toast: document.querySelector("#toast")
};

function loadFavorites() {
    try {
        return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
        return [];
    }
}

function saveFavorites() {
    localStorage.setItem(storageKey, JSON.stringify(state.favorites));
}

function normalize(value) {
    return String(value || "").trim().toLowerCase();
}

function getCurrentJob() {
    return jobsData[state.currentJobKey] || jobsData.hr;
}

function getVisibleDuties(job) {
    const keyword = normalize(state.searchTerm);
    if (!keyword) return job.duties;
    return job.duties.filter((duty) => {
        return normalize(`${job.name} ${duty.title} ${duty.text} ${duty.hint}`).includes(keyword);
    });
}

function renderJobs() {
    const keyword = normalize(state.searchTerm);
    elements.jobList.innerHTML = Object.entries(jobsData).map(([key, job]) => {
        const matched = !keyword || normalize(`${job.name} ${job.duties.map((duty) => `${duty.title} ${duty.text}`).join(" ")}`).includes(keyword);
        if (!matched) return "";
        const active = key === state.currentJobKey ? " active" : "";
        return `
            <button class="job-item${active}" type="button" data-job-key="${key}" aria-pressed="${key === state.currentJobKey}">
                <span class="job-icon" aria-hidden="true">${job.icon}</span>
                <span>
                    <span class="job-name">${job.name}</span>
                    <span class="job-count">${job.duties.length} 个职责</span>
                </span>
            </button>
        `;
    }).join("");
}

function renderDuties() {
    const job = getCurrentJob();
    const duties = getVisibleDuties(job);
    elements.roleTitle.textContent = job.name;

    if (!duties.length) {
        elements.dutiesList.innerHTML = `<div class="empty-state">没有匹配的职责</div>`;
        return;
    }

    elements.dutiesList.innerHTML = duties.map((duty) => {
        const active = duty.id === state.currentDutyId ? " active" : "";
        return `
            <article class="duty-card${active}" data-duty-id="${duty.id}">
                <div class="duty-title">
                    <span>${duty.title}</span>
                    <span class="status-pill">${duty.hint}</span>
                </div>
                <p>${duty.text}</p>
                <div class="duty-actions">
                    <button class="primary-button" type="button" data-action="generate" data-duty-id="${duty.id}">生成</button>
                </div>
            </article>
        `;
    }).join("");
}

function buildPrompt(job, duty) {
    return `# 专家级 AI 提示词 · ${job.name} · ${duty.title}

## 角色设定
你是一位资深${job.name}，专长是「${duty.hint}」，能够把复杂工作拆解成可执行方案。

## 任务目标
请围绕以下职责，产出一份可直接落地的工作方案：
${duty.text}

## 输出要求
1. 先判断这项职责在业务中的关键目标和常见难点。
2. 给出不少于 4 个执行步骤，每一步包含目的、动作和交付物。
3. 提供一个可直接复用的模板，可以是表格、清单、话术或 Markdown 结构。
4. 列出 3 个常见风险，并给出规避建议。
5. 最后给出验收指标，指标需要可观察、可衡量。

## 约束条件
- 使用中文输出，表达专业但不要空泛。
- 涉及跨部门协作时，明确相关角色和沟通节点。
- 不要只讲原则，要给出具体示例。
- 输出结尾附上“下一步行动建议”。

请现在开始。`;
}

function generatePrompt(dutyId) {
    const job = getCurrentJob();
    const duty = job.duties.find((item) => item.id === dutyId);
    if (!duty) return;

    state.currentDutyId = duty.id;
    state.latestPrompt = buildPrompt(job, duty);
    state.latestTitle = `${job.name} · ${duty.title}`;
    elements.promptOutput.textContent = state.latestPrompt;
    elements.promptMeta.textContent = state.latestTitle;
    renderDuties();
    updateFavoriteButton();
    showToast("提示词已生成");
}

function updateFavoriteButton() {
    const exists = state.favorites.some((item) => item.prompt === state.latestPrompt);
    elements.favoriteBtn.textContent = exists ? "★" : "☆";
    elements.favoriteBtn.setAttribute("aria-label", exists ? "已收藏当前提示词" : "收藏当前提示词");
}

function renderFavorites() {
    if (!state.favorites.length) {
        elements.favoritesList.innerHTML = `<div class="empty-state">暂无收藏</div>`;
        return;
    }

    elements.favoritesList.innerHTML = state.favorites.map((item, index) => `
        <article class="favorite-card">
            <strong>${item.title}</strong>
            <p>${item.prompt}</p>
            <button class="ghost-button" type="button" data-action="restore-favorite" data-index="${index}">打开</button>
        </article>
    `).join("");
}

function addFavorite() {
    if (!state.latestPrompt) {
        showToast("请先生成提示词");
        return;
    }

    const exists = state.favorites.some((item) => item.prompt === state.latestPrompt);
    if (exists) {
        showToast("已经在收藏夹");
        return;
    }

    state.favorites.unshift({
        title: state.latestTitle,
        prompt: state.latestPrompt,
        createdAt: new Date().toISOString()
    });
    state.favorites = state.favorites.slice(0, 12);
    saveFavorites();
    renderFavorites();
    updateFavoriteButton();
    showToast("已收藏");
}

async function copyPrompt() {
    if (!state.latestPrompt) {
        showToast("请先生成提示词");
        return;
    }

    try {
        await navigator.clipboard.writeText(state.latestPrompt);
        showToast("已复制");
    } catch {
        const textarea = document.createElement("textarea");
        textarea.value = state.latestPrompt;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        showToast("已复制");
    }
}

function downloadPrompt() {
    if (!state.latestPrompt) {
        showToast("请先生成提示词");
        return;
    }

    const blob = new Blob([state.latestPrompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.latestTitle.replace(/[\\/:*?"<>|]/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("已下载");
}

function createCustomDuty(event) {
    event.preventDefault();
    const title = elements.customDutyTitle.value.trim();
    const text = elements.customDutyText.value.trim();

    if (!title || !text) {
        showToast("请补全职责名称和描述");
        return;
    }

    const job = getCurrentJob();
    const customDuty = {
        id: `custom_${Date.now()}`,
        title,
        text,
        hint: "自定义"
    };
    job.duties.unshift(customDuty);
    elements.customForm.reset();
    elements.customForm.hidden = true;
    renderJobs();
    generatePrompt(customDuty.id);
}

let toastTimer = 0;
function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 1600);
}

function bindEvents() {
    elements.jobList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-job-key]");
        if (!button) return;
        state.currentJobKey = button.dataset.jobKey;
        state.currentDutyId = "";
        renderJobs();
        renderDuties();
    });

    elements.dutiesList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action='generate']");
        if (!button) return;
        generatePrompt(button.dataset.dutyId);
    });

    elements.favoritesList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action='restore-favorite']");
        if (!button) return;
        const item = state.favorites[Number(button.dataset.index)];
        if (!item) return;
        state.latestPrompt = item.prompt;
        state.latestTitle = item.title;
        elements.promptOutput.textContent = item.prompt;
        elements.promptMeta.textContent = item.title;
        updateFavoriteButton();
        showToast("已打开收藏");
    });

    elements.searchInput.addEventListener("input", (event) => {
        state.searchTerm = event.target.value;
        renderJobs();
        renderDuties();
    });

    elements.copyBtn.addEventListener("click", copyPrompt);
    elements.favoriteBtn.addEventListener("click", addFavorite);
    elements.downloadBtn.addEventListener("click", downloadPrompt);
    elements.customForm.addEventListener("submit", createCustomDuty);
    elements.toggleCustomBtn.addEventListener("click", () => {
        elements.customForm.hidden = !elements.customForm.hidden;
        if (!elements.customForm.hidden) elements.customDutyTitle.focus();
    });
    elements.clearFavoritesBtn.addEventListener("click", () => {
        state.favorites = [];
        saveFavorites();
        renderFavorites();
        updateFavoriteButton();
        showToast("收藏夹已清空");
    });
}

function init() {
    bindEvents();
    renderJobs();
    renderDuties();
    renderFavorites();
    updateFavoriteButton();
}

init();
