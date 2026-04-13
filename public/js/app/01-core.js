const supabaseConfig = window.SUPABASE_CONFIG || {};
const supabaseClient = supabaseConfig.url && supabaseConfig.anonKey
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
    : null;

const state = {
    categories: [],
    users: [],
    activeTab: 'public-overview',
    searchQuery: '',
    currentEditingType: null,
    currentEditingId: null,
    selectedCategoryId: null,
    expandedCategoryId: null,
    inlineModuleEditor: {
        categoryId: null,
        modules: [],
        editingIndex: null,
    },
    userListFilters: {
        categoryId: 'all',
        role: 'all',
        active: 'all',
        sort: 'name-asc',
    },
    userBulkSelectionMode: false,
    selectedUserIds: {},
    reportMatrixFilters: {
        role: 'all',
        selectedCategoryIds: [],
        moduleIdsByCategory: {},
    },
    dashboardMatrixFilters: {
        role: 'all',
        selectedCategoryIds: [],
        moduleIdsByCategory: {},
    },
    publicMatrixFilters: {
        role: 'all',
        selectedCategoryIds: [],
        moduleIdsByCategory: {},
    },
    matrixFilterPanels: {
        public: { categories: false, modules: false },
        dashboard: { categories: false, modules: false },
        report: { categories: false, modules: false },
    },
    publicListFilters: {
        role: 'all',
        categoryId: 'all',
        status: 'all',
        sort: 'name-asc',
    },
    publicExpandedUserId: null,
    userCategoryDrafts: {},
    tempModules: [],
    tempAssignedCategoryIds: [],
    session: null,
    authReady: false,
    bootError: '',
    publicDataError: '',
    hasLoadedOnce: false,
    pending: {
        loadData: false,
        auth: false,
        saveCategory: false,
        saveUser: false,
        importUsers: false,
        normalizeRoles: false,
        saveStatus: false,
        deleteCategory: false,
        deleteUser: false,
        toggleUserActive: false,
        bulkUserAction: false,
        deleteAdmin: false,
        saveAdminRecord: false,
    },
    rpcAvailability: {
        saveCategoryWithModules: null,
        saveCollaboratorWithCategories: null,
    },
    statusDraft: {},
    selectedStatusCells: {},
    statusSelectionMode: false,
    statusSelectionDrag: {
        active: false,
        shouldSelect: true,
        lastKey: '',
        moved: false,
        suppressClick: false,
    },
    bulkStatusTarget: 'Concluído',
    skipNextViewAnimation: false,
    currentViewAnimationClass: 'animate-fade-in',
    dashboardAnimationValues: {},
    mobileMenuOpen: false,
    savedFlashKeys: new Set(),
    mobileMatrixPages: {},
    userListPage: 0,
    admins: [],
    adminListError: '',
    suppressAuthStateReactions: false,
};
let loadDataPromise = null;
const USER_PAGE_SIZE = 20;
let fixedMatrixScrollbarCleanup = null;
let fixedMatrixScrollbarFrame = null;
let statusSelectionHelpTimeout = null;
let statusSelectionHelpCleanup = null;
let statusSelectionHelpFrame = null;

const STATUS_SELECTION_HELP_ID = 'status-selection-help';
const STATUS_SELECTION_HELP_HIGHLIGHT_CLASS = 'status-selection-help-highlight';

const MODULE_STATUS = Object.freeze({
    NOT_COMPLETED: 'Pendente',
    COMPLETED: 'Concluído',
    SCHEDULED: 'Agendado',
    NOT_PARTICIPATING: 'Não se aplica',
});

const MODULE_STATUS_VISUAL = Object.freeze({
    [MODULE_STATUS.COMPLETED]: {
        label: 'Concluído',
        icon: 'check',
        iconClass: 'text-emerald-500',
        dotClass: 'bg-emerald-500 border-emerald-500',
        dotIconClass: 'text-white',
        hoverClass: 'hover:text-emerald-600',
    },
    [MODULE_STATUS.NOT_COMPLETED]: {
        label: 'Não Concluído',
        icon: 'x',
        iconClass: 'text-rose-500',
        dotClass: 'bg-rose-500 border-rose-500',
        dotIconClass: 'text-white',
        hoverClass: 'hover:text-rose-600',
    },
    [MODULE_STATUS.SCHEDULED]: {
        label: 'Agendado',
        icon: 'clock-3',
        iconClass: 'text-amber-500',
        dotClass: 'bg-amber-400 border-amber-400',
        dotIconClass: 'text-white',
        hoverClass: 'hover:text-amber-600',
    },
    [MODULE_STATUS.NOT_PARTICIPATING]: {
        label: 'Não participa',
        icon: 'minus',
        iconClass: 'text-slate-600',
        dotClass: 'bg-slate-600 border-slate-600',
        dotIconClass: 'text-white',
        hoverClass: 'hover:text-slate-700',
    },
});

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

function formatCountLabel(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
}

function ensureClient() {
    if (!supabaseClient) {
        throw new Error('Supabase não configurado. Verifique URL e anon key em supabase-config.js.');
    }
}

function isAdminSession() {
    return Boolean(state.session && !state.session?.user?.is_anonymous);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const tone = type === 'error'
        ? 'bg-red-50 border-red-200 text-red-700'
        : type === 'info'
            ? 'bg-sky-50 border-sky-200 text-sky-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700';

    const toast = document.createElement('div');
    toast.className = `min-w-[260px] max-w-sm px-4 py-3 rounded-2xl border shadow-lg text-sm font-semibold animate-fade-in ${tone}`;
    toast.textContent = message;
    container.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3500);
}

function setShellVisibility(isAuthenticated) {
    const shellVisible = state.authReady;
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('app-shell').classList.toggle('hidden', !shellVisible);

    document.querySelectorAll('.public-session-block').forEach((element) => {
        element.classList.toggle('hidden', isAuthenticated);
    });
    document.querySelectorAll('.auth-session-block').forEach((element) => {
        element.classList.toggle('hidden', !isAuthenticated);
    });

    if (!shellVisible) {
        state.mobileMenuOpen = false;
    }
    updateMobileMenuState();
}

function formatError(error, fallback) {
    return error?.message || fallback;
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
        }),
    ]);
}

function isPending(key) {
    return Boolean(state.pending[key]);
}

function setPending(key, value) {
    if (state.pending[key] === value) {
        return;
    }

    state.pending[key] = value;

    // Re-render when auth layer is ready so both public and admin UIs remain in sync.
    if (state.authReady) {
        try {
            render();
        } catch (error) {
            console.error('Falha ao renderizar UI após atualização de estado pendente.', error);
            updateSyncIndicator();
        }
        return;
    }

    updateSyncIndicator();
}

function setButtonLoading(buttonId, isLoading, loadingLabel = 'Processando...') {
    const button = document.getElementById(buttonId);
    if (!button) {
        return;
    }

    if (isLoading) {
        if (!button.dataset.originalHtml) {
            button.dataset.originalHtml = button.innerHTML;
        }
        button.disabled = true;
        button.classList.add('opacity-70', 'cursor-not-allowed');
        button.innerHTML = `
            <span class="inline-flex items-center justify-center gap-2">
                <i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i>
                <span>${escapeHtml(loadingLabel)}</span>
            </span>
        `;
        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
        return;
    }

    button.disabled = false;
    button.classList.remove('opacity-70', 'cursor-not-allowed');
    if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
    }
}

function isRpcMissing(error, functionName) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === 'PGRST202'
        || message.includes('could not find the function')
        || message.includes(String(functionName || '').toLowerCase());
}

function toUserFriendlyError(error, fallback) {
    const message = String(error?.message || '').toLowerCase();
    const detail = String(error?.details || '').toLowerCase();
    const code = String(error?.code || '');

    if (code === '23505' && (message.includes('categories_name_key') || detail.includes('categories_name_key'))) {
        return 'Já existe uma categoria com esse nome.';
    }

    if (code === '23505' && (message.includes('modules_category_name_unique') || detail.includes('modules_category_name_unique'))) {
        return 'Existe módulo repetido nessa categoria. Ajuste os nomes.';
    }

    if (code === '23505' && (message.includes('collaborators_external_id_key') || detail.includes('collaborators_external_id_key'))) {
        return 'O ID externo do usuário já está em uso.';
    }

    if (code === '23505' && (message.includes('portal_admins_email_key') || detail.includes('portal_admins_email_key'))) {
        return 'Já existe um admin com esse e-mail.';
    }

    if (code === '23514' && (message.includes('collaborator_module_status_status_check') || detail.includes('collaborator_module_status_status_check'))) {
        return 'Seu schema do Supabase ainda não aceita o status "Agendado". Atualize o SQL da tabela collaborator_module_status.';
    }

    if (message.includes('user already registered')) {
        return 'Já existe um usuário com esse e-mail.';
    }

    if (message.includes('jwt') || message.includes('not authenticated')) {
        return 'Sessão expirada. Faça login novamente.';
    }

    if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
        return 'Sem permissão para essa ação no banco (RLS).';
    }

    return fallback;
}

function splitName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
        return { firstName: '', lastName: '' };
    }

    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
    }

    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    };
}

function createExternalId(fullName) {
    const base = String(fullName || 'usuario')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'usuario';

    return `${base}-${Date.now().toString(36)}`;
}

function normalizeComparisonKey(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .trim();
}

function toTitleCase(value) {
    return String(value || '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function normalizeRoleLabel(value) {
    const raw = String(value || '').trim();
    if (!raw) {
        return '';
    }

    const normalized = normalizeComparisonKey(raw);
    const groups = [
        { keywords: ['assist'], label: 'Assistente' },
        { keywords: ['analist'], label: 'Analista' },
        { keywords: ['especialist'], label: 'Especialista' },
        { keywords: ['coorden'], label: 'Coordenador' },
        { keywords: ['supervis'], label: 'Supervisor' },
        { keywords: ['gerent'], label: 'Gerente' },
        { keywords: ['gestor'], label: 'Gestor' },
        { keywords: ['lider'], label: 'Líder' },
        { keywords: ['diretor', 'director'], label: 'Diretor' },
        { keywords: ['consult'], label: 'Consultor' },
        { keywords: ['tecnic'], label: 'Técnico' },
        { keywords: ['estagi'], label: 'Estagiário' },
    ];

    for (const group of groups) {
        if (group.keywords.some((keyword) => normalized.includes(keyword))) {
            return group.label;
        }
    }

    return toTitleCase(raw);
}

function getRoleSegment(roleLabel) {
    const key = normalizeComparisonKey(roleLabel);
    if (!key) {
        return 'Não classificado';
    }

    if (['diretor', 'gerent', 'gestor', 'coorden', 'supervis', 'lider'].some((term) => key.includes(term))) {
        return 'Liderança';
    }
    if (['analist', 'especialist', 'consult', 'tecnic'].some((term) => key.includes(term))) {
        return 'Especialista';
    }
    if (['assist', 'estagi'].some((term) => key.includes(term))) {
        return 'Suporte';
    }
    if (['propagand', 'comercial', 'venda', 'sales'].some((term) => key.includes(term))) {
        return 'Comercial';
    }

    return 'Operacional';
}

function isUserActive(user) {
    return user?.isActive !== false;
}

function getUsersByActivity(options = {}) {
    const includeInactive = options.includeInactive === true;
    return includeInactive ? state.users : state.users.filter((user) => isUserActive(user));
}

function getFilteredUsers(options = {}) {
    const includeInactive = options.includeInactive === true;
    const sourceUsers = getUsersByActivity({ includeInactive });
    const query = state.searchQuery.trim().toLowerCase();
    if (!query) {
        return sourceUsers;
    }

    return sourceUsers.filter((user) => {
        const categoryNames = user.categoryIds
            .map((categoryId) => state.categories.find((category) => category.id === categoryId)?.name || '')
            .join(' ')
            .toLowerCase();

        return `${user.firstName} ${user.lastName}`.trim().toLowerCase().includes(query)
            || user.role.toLowerCase().includes(query)
            || String(user.email || '').toLowerCase().includes(query)
            || user.externalId.toLowerCase().includes(query)
            || categoryNames.includes(query);
    });
}

function getMatrixFilterState(scope) {
    if (scope === 'public') {
        return state.publicMatrixFilters;
    }
    if (scope === 'dashboard') {
        return state.dashboardMatrixFilters;
    }
    return state.reportMatrixFilters;
}

function getMatrixFilterPanels(scope) {
    if (!state.matrixFilterPanels[scope]) {
        state.matrixFilterPanels[scope] = { categories: false, modules: false };
    }
    return state.matrixFilterPanels[scope];
}

function toggleMatrixFilterPanel(scope, panel) {
    if (!['categories', 'modules'].includes(panel)) {
        return;
    }

    const panels = getMatrixFilterPanels(scope);
    panels[panel] = !Boolean(panels[panel]);
    renderSmooth();
}

function getAllCategoryIds() {
    return state.categories.map((category) => category.id);
}

function getActiveCategoryIds(filterState) {
    const allCategoryIds = getAllCategoryIds();
    const selectedCategoryIds = Array.isArray(filterState?.selectedCategoryIds)
        ? filterState.selectedCategoryIds.filter((id) => allCategoryIds.includes(id))
        : [];

    if (!selectedCategoryIds.length) {
        return allCategoryIds;
    }

    return selectedCategoryIds;
}

function getSelectedModuleIdsForCategory(filterState, categoryId) {
    const raw = filterState?.moduleIdsByCategory?.[categoryId];
    if (!Array.isArray(raw)) {
        return [];
    }
    const category = state.categories.find((item) => item.id === categoryId);
    if (!category) {
        return [];
    }
    const validModuleIds = new Set(category.modules.map((module) => module.id));
    return raw.filter((moduleId) => validModuleIds.has(moduleId));
}

function getVisibleMatrixCategories(filterState) {
    const activeCategorySet = new Set(getActiveCategoryIds(filterState));

    return state.categories
        .filter((category) => activeCategorySet.has(category.id))
        .map((category) => {
            const selectedModuleIds = getSelectedModuleIdsForCategory(filterState, category.id);
            if (!selectedModuleIds.length) {
                return {
                    ...category,
                    modules: [...category.modules],
                };
            }

            const selectedModuleSet = new Set(selectedModuleIds);
            const filteredModules = category.modules.filter((module) => selectedModuleSet.has(module.id));
            return {
                ...category,
                modules: filteredModules.length ? filteredModules : [...category.modules],
            };
        });
}

function getUsersForMatrixView(filterState) {
    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

    return getFilteredUsers()
        .filter((user) => filterState.role === 'all' || user.role === filterState.role)
        .sort((a, b) => collator.compare(a.fullName, b.fullName));
}

function setMatrixRoleFilter(scope, role) {
    const filterState = getMatrixFilterState(scope);
    filterState.role = role || 'all';
    renderSmooth();
}

function selectAllMatrixCategories(scope) {
    const filterState = getMatrixFilterState(scope);
    filterState.selectedCategoryIds = [];
    renderSmooth();
}

function toggleMatrixCategory(scope, categoryId) {
    const filterState = getMatrixFilterState(scope);
    const allCategoryIds = getAllCategoryIds();
    if (!allCategoryIds.includes(categoryId)) {
        return;
    }

    const activeCategoryIds = getActiveCategoryIds(filterState);
    const allSelected = !filterState.selectedCategoryIds.length;

    if (allSelected) {
        filterState.selectedCategoryIds = [categoryId];
        renderSmooth();
        return;
    }

    if (activeCategoryIds.includes(categoryId)) {
        const nextCategoryIds = activeCategoryIds.filter((id) => id !== categoryId);
        filterState.selectedCategoryIds = nextCategoryIds.length ? nextCategoryIds : [];
        renderSmooth();
        return;
    }

    const nextCategoryIds = [...activeCategoryIds, categoryId];
    filterState.selectedCategoryIds = nextCategoryIds.length >= allCategoryIds.length ? [] : nextCategoryIds;
    renderSmooth();
}

function selectAllMatrixCategoryModules(scope, categoryId) {
    const filterState = getMatrixFilterState(scope);
    if (filterState.moduleIdsByCategory?.[categoryId]) {
        delete filterState.moduleIdsByCategory[categoryId];
    }
    renderSmooth();
}

function toggleMatrixModule(scope, categoryId, moduleId) {
    const filterState = getMatrixFilterState(scope);
    const category = state.categories.find((item) => item.id === categoryId);
    if (!category || !category.modules.some((module) => module.id === moduleId)) {
        return;
    }

    const currentSelectedModuleIds = getSelectedModuleIdsForCategory(filterState, categoryId);
    let nextModuleIds = [];

    if (!currentSelectedModuleIds.length) {
        nextModuleIds = [moduleId];
    } else if (currentSelectedModuleIds.includes(moduleId)) {
        nextModuleIds = currentSelectedModuleIds.filter((id) => id !== moduleId);
    } else {
        nextModuleIds = [...currentSelectedModuleIds, moduleId];
    }

    if (!nextModuleIds.length || nextModuleIds.length >= category.modules.length) {
        delete filterState.moduleIdsByCategory[categoryId];
    } else {
        filterState.moduleIdsByCategory[categoryId] = nextModuleIds;
    }

    renderSmooth();
}

function clearMatrixFilters(scope) {
    const filterState = getMatrixFilterState(scope);
    state.searchQuery = '';
    filterState.role = 'all';
    filterState.selectedCategoryIds = [];
    filterState.moduleIdsByCategory = {};
    renderSmooth();
}

function getMatrixFiltersMarkup(scope) {
    const filterState = getMatrixFilterState(scope);
    const panelState = getMatrixFilterPanels(scope);
    const isCategoriesOpen = Boolean(panelState.categories);
    const isModulesOpen = Boolean(panelState.modules);
    const roleOptions = [...new Set(state.users.map((user) => user.role).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    const activeCategoryIds = getActiveCategoryIds(filterState);
    const activeCategorySet = new Set(activeCategoryIds);
    const categorySummaryLabel = !filterState.selectedCategoryIds.length
        ? 'Todas as categorias'
        : `${activeCategoryIds.length} categoria(s) selecionada(s)`;
    const modulesTotal = activeCategoryIds.reduce((sum, categoryId) => {
        const category = state.categories.find((item) => item.id === categoryId);
        return sum + (category?.modules?.length || 0);
    }, 0);
    const selectedModulesTotal = activeCategoryIds.reduce((sum, categoryId) => {
        const category = state.categories.find((item) => item.id === categoryId);
        const categoryModuleCount = category?.modules?.length || 0;
        if (!categoryModuleCount) {
            return sum;
        }
        const selectedModuleIds = getSelectedModuleIdsForCategory(filterState, categoryId);
        if (!selectedModuleIds.length) {
            return sum + categoryModuleCount;
        }
        return sum + selectedModuleIds.length;
    }, 0);
    const moduleSummaryLabel = !modulesTotal
        ? 'Nenhum módulo disponível'
        : selectedModulesTotal >= modulesTotal
            ? 'Todos os módulos'
            : `${selectedModulesTotal} de ${modulesTotal} módulo(s)`;

    return `
        <div class="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
            <div class="grid grid-cols-1 gap-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Selecione os Cargos</label>
                    <select onchange="setMatrixRoleFilter('${escapeAttr(scope)}', this.value)" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400">
                        <option value="all" ${filterState.role === 'all' ? 'selected' : ''}>Todos os Cargos</option>
                        ${roleOptions.map((role) => `
                            <option value="${escapeAttr(role)}" ${filterState.role === role ? 'selected' : ''}>${escapeHtml(role)}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50">
                <button type="button" onclick="toggleMatrixFilterPanel('${escapeAttr(scope)}', 'categories')" class="w-full px-4 py-3 flex items-center justify-between gap-3 text-left">
                    <div class="min-w-0">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Selecione as Categorias</p>
                        <p class="text-sm font-semibold text-slate-700 truncate">${escapeHtml(categorySummaryLabel)}</p>
                    </div>
                    <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}"></i>
                </button>
                <div class="overflow-hidden transition-all duration-300 ease-in-out ${isCategoriesOpen ? 'max-h-[72vh] opacity-100' : 'max-h-0 opacity-0'}">
                    <div class="px-4 pb-4 space-y-2 border-t border-slate-100 max-h-[68vh] overflow-y-auto">
                        <div class="pt-3 flex flex-wrap gap-2">
                        <button onclick="selectAllMatrixCategories('${escapeAttr(scope)}')" class="px-4 py-2 rounded-full text-sm font-bold border ${!filterState.selectedCategoryIds.length ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}">
                            Selecionar todos
                        </button>
                        ${state.categories.map((category) => {
                            const active = activeCategorySet.has(category.id);
                            return `
                                <button onclick="toggleMatrixCategory('${escapeAttr(scope)}', '${escapeAttr(category.id)}')" class="px-4 py-2 rounded-full text-sm font-bold border ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}">
                                    ${escapeHtml(category.name)}
                                </button>
                            `;
                        }).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50">
                <button type="button" onclick="toggleMatrixFilterPanel('${escapeAttr(scope)}', 'modules')" class="w-full px-4 py-3 flex items-center justify-between gap-3 text-left">
                    <div class="min-w-0">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Selecione os Módulos</p>
                        <p class="text-sm font-semibold text-slate-700 truncate">${escapeHtml(moduleSummaryLabel)}</p>
                    </div>
                    <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-300 ${isModulesOpen ? 'rotate-180' : ''}"></i>
                </button>
                <div class="overflow-hidden transition-all duration-300 ease-in-out ${isModulesOpen ? 'max-h-[72vh] opacity-100' : 'max-h-0 opacity-0'}">
                    <div class="px-4 pb-4 space-y-3 border-t border-slate-100 max-h-[68vh] overflow-y-auto">
                        ${activeCategoryIds.length ? activeCategoryIds.map((categoryId) => {
                        const category = state.categories.find((item) => item.id === categoryId);
                        if (!category) {
                            return '';
                        }
                        const selectedModuleIds = getSelectedModuleIdsForCategory(filterState, category.id);
                        const selectedSet = new Set(selectedModuleIds);
                        const allModulesSelected = !selectedModuleIds.length;
                        return `
                            <div class="space-y-1">
                                <p class="pt-3 text-xs font-bold text-slate-500">${escapeHtml(category.name)}</p>
                                <div class="flex flex-wrap gap-2">
                                    <button onclick="selectAllMatrixCategoryModules('${escapeAttr(scope)}', '${escapeAttr(category.id)}')" class="px-4 py-1.5 rounded-full text-xs font-bold border ${allModulesSelected ? 'bg-slate-700 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-600'}">
                                        Todos
                                    </button>
                                    ${category.modules.map((module) => {
                                        const active = allModulesSelected || selectedSet.has(module.id);
                                        return `
                                            <button onclick="toggleMatrixModule('${escapeAttr(scope)}', '${escapeAttr(category.id)}', '${escapeAttr(module.id)}')" class="px-4 py-1.5 rounded-full text-xs font-bold border ${active ? 'bg-slate-700 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-600'}">
                                                ${escapeHtml(module.name)}
                                            </button>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                        }).join('') : `
                            <p class="pt-3 text-sm text-slate-400">Nenhuma categoria disponível.</p>
                        `}
                    </div>
                </div>
            </div>
            <div class="flex justify-end">
                <button onclick="clearMatrixFilters('${escapeAttr(scope)}')" class="px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                    Limpar filtros
                </button>
            </div>
        </div>
    `;
}

function getPublicUsersWithProgress() {
    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

    return getUsersByActivity()
        .map((user) => {
            let totalModules = 0;
            let completedModules = 0;
            const completedCategories = [];
            const categoryStats = {};
            const assignedCategoryNames = [];
            const moduleBreakdown = [];

            for (const category of state.categories) {
                const assigned = user.categoryIds.includes(category.id);
                let done = 0;
                let trackableCount = 0;

                if (assigned) {
                    assignedCategoryNames.push(category.name);
                    const doneModules = [];
                    const pendingModules = [];
                    const notParticipatingModules = [];
                    for (const module of category.modules) {
                        const status = getModuleStatus(user, category.id, module.id);
                        if (!isModuleTrackable(status)) {
                            notParticipatingModules.push(module.name);
                            continue;
                        }

                        trackableCount += 1;
                        if (normalizeModuleStatus(status) === MODULE_STATUS.COMPLETED) {
                            done += 1;
                            doneModules.push(module.name);
                        } else {
                            pendingModules.push(module.name);
                        }
                    }
                    if (category.modules.length) {
                        moduleBreakdown.push({
                            categoryId: category.id,
                            categoryName: category.name,
                            doneModules,
                            pendingModules,
                            notParticipatingModules,
                            done,
                            total: trackableCount,
                        });
                    }
                }

                categoryStats[category.id] = {
                    assigned,
                    total: trackableCount,
                    done,
                    progress: trackableCount ? Math.round((done / trackableCount) * 100) : 0,
                };

                if (!assigned || !trackableCount) {
                    continue;
                }

                totalModules += trackableCount;
                completedModules += done;
                if (done > 0) {
                    completedCategories.push(category.name);
                }
            }

            return {
                id: user.id,
                fullName: user.fullName,
                role: user.role,
                totalModules,
                completedModules,
                progress: totalModules ? Math.round((completedModules / totalModules) * 100) : 0,
                completedCategories,
                assignedCategoryNames,
                categoryStats,
                moduleBreakdown,
                trainingState: completedModules > 0 ? 'trained' : 'untrained',
            };
        })
        .sort((a, b) => collator.compare(a.fullName, b.fullName));
}

function getPublicUsersForView() {
    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
    const query = state.searchQuery.trim().toLowerCase();
    const source = getPublicUsersWithProgress();

    const filtered = source.filter((user) => {
        if (query) {
            const moduleNames = user.moduleBreakdown.flatMap((group) => [
                ...group.doneModules,
                ...group.pendingModules,
                ...(group.notParticipatingModules || []),
            ]);
            const haystack = [
                user.fullName,
                user.role,
                ...user.assignedCategoryNames,
                ...user.completedCategories,
                ...moduleNames,
            ].join(' ').toLowerCase();
            if (!haystack.includes(query)) {
                return false;
            }
        }

        if (state.publicListFilters.role !== 'all' && user.role !== state.publicListFilters.role) {
            return false;
        }

        const selectedCategoryId = state.publicListFilters.categoryId;
        const selectedCategoryStats = selectedCategoryId !== 'all'
            ? user.categoryStats[selectedCategoryId]
            : null;

        if (selectedCategoryId !== 'all' && !selectedCategoryStats?.assigned) {
            return false;
        }

        const statusFilter = state.publicListFilters.status;
        const done = selectedCategoryStats ? selectedCategoryStats.done : user.completedModules;
        const total = selectedCategoryStats ? selectedCategoryStats.total : user.totalModules;
        if (statusFilter === 'trained' && done <= 0) {
            return false;
        }
        if (statusFilter === 'untrained' && done > 0) {
            return false;
        }
        if (statusFilter === 'complete' && !(total > 0 && done >= total)) {
            return false;
        }
        if (statusFilter === 'pending' && !(total > 0 && done < total)) {
            return false;
        }

        return true;
    });

    const sort = state.publicListFilters.sort;
    filtered.sort((a, b) => {
        if (sort === 'name-desc') {
            return collator.compare(b.fullName, a.fullName);
        }
        if (sort === 'progress-desc') {
            return b.progress - a.progress || collator.compare(a.fullName, b.fullName);
        }
        if (sort === 'progress-asc') {
            return a.progress - b.progress || collator.compare(a.fullName, b.fullName);
        }
        return collator.compare(a.fullName, b.fullName);
    });

    return filtered;
}

function setPublicRoleFilter(role) {
    state.publicListFilters.role = role || 'all';
    renderSmooth();
}

function setPublicCategoryFilter(categoryId) {
    state.publicListFilters.categoryId = categoryId || 'all';
    renderSmooth();
}

function setPublicStatusFilter(status) {
    state.publicListFilters.status = status || 'all';
    renderSmooth();
}

function setPublicSort(sort) {
    state.publicListFilters.sort = sort || 'name-asc';
    renderSmooth();
}

function clearPublicFilters() {
    state.searchQuery = '';
    state.publicListFilters = {
        role: 'all',
        categoryId: 'all',
        status: 'all',
        sort: 'name-asc',
    };
    state.publicExpandedUserId = null;
    renderSmooth();
}

function togglePublicUserModules(userId) {
    state.publicExpandedUserId = state.publicExpandedUserId === userId ? null : userId;
    renderSmooth();
}

function getUsersForManagement() {
    const filtered = getFilteredUsers({ includeInactive: true }).filter((user) => {
        if (state.userListFilters.categoryId !== 'all' && !user.categoryIds.includes(state.userListFilters.categoryId)) {
            return false;
        }

        if (state.userListFilters.role !== 'all' && user.role !== state.userListFilters.role) {
            return false;
        }

        if (state.userListFilters.active === 'active' && !isUserActive(user)) {
            return false;
        }

        if (state.userListFilters.active === 'inactive' && isUserActive(user)) {
            return false;
        }

        return true;
    });

    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
    const sort = state.userListFilters.sort;
    filtered.sort((a, b) => {
        if (sort === 'name-desc') {
            return collator.compare(b.fullName, a.fullName);
        }

        if (sort === 'role-asc') {
            return collator.compare(a.role, b.role) || collator.compare(a.fullName, b.fullName);
        }

        if (sort === 'role-desc') {
            return collator.compare(b.role, a.role) || collator.compare(a.fullName, b.fullName);
        }

        return collator.compare(a.fullName, b.fullName);
    });

    return filtered;
}

function getSelectedUserIds() {
    return Object.keys(state.selectedUserIds || {}).filter((id) => Boolean(state.selectedUserIds[id]));
}

function isUserSelectedForBulk(userId) {
    return Boolean(state.selectedUserIds?.[userId]);
}

function getSelectedUsersForBulk() {
    const selected = new Set(getSelectedUserIds());
    return state.users.filter((user) => selected.has(user.id));
}

function pruneUserBulkSelection() {
    const validUserIds = new Set(state.users.map((user) => user.id));
    const nextSelection = {};
    for (const userId of getSelectedUserIds()) {
        if (validUserIds.has(userId)) {
            nextSelection[userId] = true;
        }
    }
    state.selectedUserIds = nextSelection;
}

function getCurrentCategory() {
    return state.categories.find((category) => category.id === state.selectedCategoryId) || null;
}

function statusDraftKey(userId, categoryId, moduleId) {
    return `${userId}::${categoryId}::${moduleId}`;
}

function normalizeModuleStatus(value) {
    const normalized = normalizeComparisonKey(value);
    if (normalized === normalizeComparisonKey(MODULE_STATUS.COMPLETED)) {
        return MODULE_STATUS.COMPLETED;
    }
    if (normalized === normalizeComparisonKey(MODULE_STATUS.SCHEDULED)) {
        return MODULE_STATUS.SCHEDULED;
    }
    if (
        normalized === normalizeComparisonKey(MODULE_STATUS.NOT_PARTICIPATING)
        || normalized === normalizeComparisonKey('Não participa')
    ) {
        return MODULE_STATUS.NOT_PARTICIPATING;
    }
    if (
        normalized === normalizeComparisonKey(MODULE_STATUS.NOT_COMPLETED)
        || normalized === normalizeComparisonKey('Não Concluído')
    ) {
        return MODULE_STATUS.NOT_COMPLETED;
    }

    return MODULE_STATUS.NOT_COMPLETED;
}

function getModuleStatusVisual(status) {
    const normalizedStatus = normalizeModuleStatus(status);
    return MODULE_STATUS_VISUAL[normalizedStatus] || MODULE_STATUS_VISUAL[MODULE_STATUS.NOT_COMPLETED];
}

function getModuleStatusLabel(status) {
    return getModuleStatusVisual(status).label;
}

function isModuleTrackable(status) {
    return normalizeModuleStatus(status) !== MODULE_STATUS.NOT_PARTICIPATING;
}

function getModuleStatusPersisted(user, moduleId) {
    return normalizeModuleStatus(user?.moduleStatuses?.[moduleId]);
}

function getModuleStatus(user, categoryId, moduleId) {
    const key = statusDraftKey(user.id, categoryId, moduleId);
    if (Object.prototype.hasOwnProperty.call(state.statusDraft, key)) {
        return normalizeModuleStatus(state.statusDraft[key]);
    }

    return getModuleStatusPersisted(user, moduleId);
}

function isModuleDonePersisted(user, _categoryId, moduleId) {
    return getModuleStatusPersisted(user, moduleId) === MODULE_STATUS.COMPLETED;
}

function isModuleDone(user, categoryId, moduleId) {
    return getModuleStatus(user, categoryId, moduleId) === MODULE_STATUS.COMPLETED;
}

function hasPendingStatusChanges() {
    return Object.keys(state.statusDraft).length > 0;
}

function selectedStatusCellCount() {
    return Object.keys(state.selectedStatusCells).length;
}

function hasSelectedStatusCells() {
    return selectedStatusCellCount() > 0;
}

function isStatusCellSelected(userId, categoryId, moduleId) {
    return Boolean(state.selectedStatusCells[statusDraftKey(userId, categoryId, moduleId)]);
}

function clearStatusSelection() {
    state.selectedStatusCells = {};
    state.statusSelectionDrag.active = false;
    state.statusSelectionDrag.shouldSelect = true;
    state.statusSelectionDrag.lastKey = '';
    state.statusSelectionDrag.moved = false;
    state.statusSelectionDrag.suppressClick = false;
}

function clearStatusSelectionHelp() {
    if (statusSelectionHelpTimeout) {
        window.clearTimeout(statusSelectionHelpTimeout);
        statusSelectionHelpTimeout = null;
    }
    if (statusSelectionHelpFrame) {
        window.cancelAnimationFrame(statusSelectionHelpFrame);
        statusSelectionHelpFrame = null;
    }
    if (statusSelectionHelpCleanup) {
        statusSelectionHelpCleanup();
        statusSelectionHelpCleanup = null;
    }

    const helpBubble = document.getElementById(STATUS_SELECTION_HELP_ID);
    if (helpBubble) {
        helpBubble.remove();
    }

    document.querySelectorAll(`.${STATUS_SELECTION_HELP_HIGHLIGHT_CLASS}`).forEach((highlightedCell) => {
        highlightedCell.classList.remove('ring-4', 'ring-indigo-300', 'ring-offset-1', STATUS_SELECTION_HELP_HIGHLIGHT_CLASS);
    });
}

function showStatusSelectionHelp() {
    clearStatusSelectionHelp();

    const firstSelectableCell = document.querySelector('.status-selectable-cell-button:not([disabled])');
    if (!firstSelectableCell) {
        return;
    }

    firstSelectableCell.classList.add('ring-4', 'ring-indigo-300', 'ring-offset-1', STATUS_SELECTION_HELP_HIGHLIGHT_CLASS);

    const bubble = document.createElement('div');
    bubble.id = STATUS_SELECTION_HELP_ID;
    bubble.className = 'fixed z-50 max-w-[280px] rounded-xl bg-slate-900 text-white text-xs font-semibold px-3 py-2 shadow-xl';
    bubble.textContent = 'Selecione os campos dos usuários que você deseja alterar o status';

    const arrow = document.createElement('span');
    arrow.className = 'absolute w-2.5 h-2.5 bg-slate-900 rotate-45';
    bubble.appendChild(arrow);
    document.body.appendChild(bubble);

    const positionHelpBubble = () => {
        if (!bubble.isConnected) {
            return;
        }

        const highlightedCell = document.querySelector(`.${STATUS_SELECTION_HELP_HIGHLIGHT_CLASS}`);
        if (!highlightedCell) {
            clearStatusSelectionHelp();
            return;
        }

        const targetRect = highlightedCell.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();
        const viewportPadding = 8;
        const bubbleOffset = 10;

        let top = targetRect.top - bubbleRect.height - bubbleOffset;
        let renderAbove = true;
        if (top < viewportPadding) {
            top = targetRect.bottom + bubbleOffset;
            renderAbove = false;
        }

        let left = targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2);
        left = Math.max(viewportPadding, Math.min(left, window.innerWidth - bubbleRect.width - viewportPadding));

        bubble.style.top = `${top}px`;
        bubble.style.left = `${left}px`;

        const pointerCenterX = targetRect.left + (targetRect.width / 2);
        const arrowLeft = Math.max(8, Math.min(bubbleRect.width - 18, pointerCenterX - left - 5));
        arrow.style.left = `${arrowLeft}px`;
        arrow.style.top = '';
        arrow.style.bottom = '';
        if (renderAbove) {
            arrow.style.bottom = '-5px';
        } else {
            arrow.style.top = '-5px';
        }
    };

    const scheduleHelpBubblePosition = () => {
        if (statusSelectionHelpFrame) {
            return;
        }
        statusSelectionHelpFrame = window.requestAnimationFrame(() => {
            statusSelectionHelpFrame = null;
            positionHelpBubble();
        });
    };

    positionHelpBubble();
    window.addEventListener('scroll', scheduleHelpBubblePosition, true);
    window.addEventListener('resize', scheduleHelpBubblePosition);
    statusSelectionHelpCleanup = () => {
        window.removeEventListener('scroll', scheduleHelpBubblePosition, true);
        window.removeEventListener('resize', scheduleHelpBubblePosition);
    };

    statusSelectionHelpTimeout = window.setTimeout(() => {
        clearStatusSelectionHelp();
    }, 5500);
}

function toggleStatusSelectionMode() {
    if (!isAdminSession() || isPending('saveStatus') || isPending('loadData')) {
        return;
    }
    if (state.statusSelectionMode) {
        state.statusSelectionMode = false;
        clearStatusSelection();
        clearStatusSelectionHelp();
        render();
        return;
    }

    state.statusSelectionMode = true;
    render();
    window.requestAnimationFrame(() => {
        showStatusSelectionHelp();
    });
}

function setStatusForSelectedCells(status) {
    if (!isAdminSession()) {
        return;
    }

    if (isPending('saveStatus') || isPending('loadData')) {
        return;
    }

    if (!state.statusSelectionMode) {
        return;
    }

    const selectedKeys = Object.keys(state.selectedStatusCells);
    if (!selectedKeys.length) {
        return;
    }

    const targetStatus = normalizeModuleStatus(status || state.bulkStatusTarget);
    state.bulkStatusTarget = targetStatus;
    let applied = 0;
    const nextSelection = {};

    for (const key of selectedKeys) {
        const [userId, categoryId, moduleId] = key.split('::');
        const user = state.users.find((item) => item.id === userId);
        if (!user || !user.categoryIds.includes(categoryId)) {
            continue;
        }

        const category = state.categories.find((item) => item.id === categoryId);
        const moduleExists = category?.modules?.some((module) => module.id === moduleId);
        if (!moduleExists) {
            continue;
        }

        nextSelection[key] = true;

        const persistedStatus = getModuleStatusPersisted(user, moduleId);
        if (persistedStatus === targetStatus) {
            delete state.statusDraft[key];
        } else {
            state.statusDraft[key] = targetStatus;
        }
        applied += 1;
    }

    state.selectedStatusCells = nextSelection;

    if (applied) {
        showToast(`${formatCountLabel(applied, 'módulo marcado', 'módulos marcados')} como ${getModuleStatusLabel(targetStatus)}.`, 'info');
    } else {
        showToast('Nenhum módulo válido foi selecionado.', 'info');
    }

    render();
}

function cancelStatusChanges() {
    if (!isAdminSession()) {
        return;
    }

    if (isPending('saveStatus') || isPending('loadData')) {
        return;
    }

    state.statusDraft = {};
    state.statusSelectionMode = false;
    clearStatusSelection();
    clearStatusSelectionHelp();
    render();
}

function selectAllVisibleStatusCells() {
    if (!isAdminSession() || isPending('saveStatus') || isPending('loadData')) {
        return;
    }

    const nextSelection = {};
    for (const user of getFilteredUsers()) {
        for (const category of state.categories) {
            if (!user.categoryIds.includes(category.id)) {
                continue;
            }
            for (const module of category.modules) {
                nextSelection[statusDraftKey(user.id, category.id, module.id)] = true;
            }
        }
    }

    state.selectedStatusCells = nextSelection;
    render();
}

function captureScrollPositions() {
    const positions = {};
    document.querySelectorAll('[data-scroll-key]').forEach((element) => {
        const key = element.getAttribute('data-scroll-key');
        if (!key) {
            return;
        }
        positions[key] = {
            left: element.scrollLeft,
            top: element.scrollTop,
        };
    });
    return positions;
}

function restoreScrollPositions(positions) {
    if (!positions) {
        return;
    }

    window.requestAnimationFrame(() => {
        Object.entries(positions).forEach(([key, position]) => {
            const element = document.querySelector(`[data-scroll-key="${key}"]`);
            if (!element) {
                return;
            }
            element.scrollLeft = position.left;
            element.scrollTop = position.top;
        });
    });
}

function cancelFixedMatrixScrollbarSetup() {
    if (fixedMatrixScrollbarFrame) {
        window.cancelAnimationFrame(fixedMatrixScrollbarFrame);
        fixedMatrixScrollbarFrame = null;
    }
}

function teardownFixedMatrixScrollbar() {
    cancelFixedMatrixScrollbarSetup();
    if (fixedMatrixScrollbarCleanup) {
        fixedMatrixScrollbarCleanup();
        fixedMatrixScrollbarCleanup = null;
    }

    const dock = document.getElementById('matrix-scrollbar-dock');
    if (!dock) {
        return;
    }
    dock.classList.add('hidden');
    dock.style.left = '';
    dock.style.right = '';
}

function isElementVisible(element) {
    if (!element) {
        return false;
    }
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
}

function pickScrollableMatrixContainer() {
    const candidates = Array.from(document.querySelectorAll('.fixed-scroll-target[data-scroll-key]'))
        .filter((element) => isElementVisible(element) && element.scrollWidth > element.clientWidth + 1);

    if (!candidates.length) {
        return null;
    }

    const inViewport = candidates.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
    });

    if (!inViewport.length) {
        return candidates[0];
    }

    inViewport.sort((a, b) => {
        const aTop = Math.max(a.getBoundingClientRect().top, 0);
        const bTop = Math.max(b.getBoundingClientRect().top, 0);
        return aTop - bTop;
    });
    return inViewport[0];
}

function setupFixedMatrixScrollbar() {
    teardownFixedMatrixScrollbar();
    if (window.innerWidth < 1024) {
        return;
    }

    const dock = document.getElementById('matrix-scrollbar-dock');
    const track = document.getElementById('matrix-scrollbar-track');
    const inner = document.getElementById('matrix-scrollbar-inner');
    const matrixScroller = pickScrollableMatrixContainer();
    if (!dock || !track || !inner || !matrixScroller) {
        return;
    }

    let syncing = false;
    const syncFromMatrix = () => {
        if (syncing) {
            return;
        }
        syncing = true;
        track.scrollLeft = matrixScroller.scrollLeft;
        syncing = false;
    };

    const syncFromDock = () => {
        if (syncing) {
            return;
        }
        syncing = true;
        matrixScroller.scrollLeft = track.scrollLeft;
        syncing = false;
    };

    let layoutFrame = null;
    const refreshLayout = () => {
        if (!matrixScroller.isConnected || !isElementVisible(matrixScroller)) {
            dock.classList.add('hidden');
            return;
        }

        if (matrixScroller.scrollWidth <= matrixScroller.clientWidth + 1) {
            dock.classList.add('hidden');
            return;
        }

        const rect = matrixScroller.getBoundingClientRect();
        const header = document.querySelector('main header');
        const headerBottom = header ? header.getBoundingClientRect().bottom : 0;

        const viewportTop = Math.max(rect.top, headerBottom);
        const viewportBottom = Math.min(rect.bottom, window.innerHeight);
        const visibleHeight = viewportBottom - viewportTop;
        if (visibleHeight < 72) {
            dock.classList.add('hidden');
            return;
        }

        dock.style.left = `${Math.max(0, Math.round(rect.left))}px`;
        dock.style.right = `${Math.max(0, Math.round(window.innerWidth - rect.right))}px`;
        inner.style.width = `${Math.max(matrixScroller.scrollWidth, 1)}px`;
        syncFromMatrix();
        dock.classList.remove('hidden');
    };
    const scheduleRefreshLayout = () => {
        if (layoutFrame) {
            return;
        }
        layoutFrame = window.requestAnimationFrame(() => {
            layoutFrame = null;
            refreshLayout();
        });
    };

    matrixScroller.addEventListener('scroll', syncFromMatrix);
    track.addEventListener('scroll', syncFromDock);
    window.addEventListener('resize', scheduleRefreshLayout);
    window.addEventListener('scroll', scheduleRefreshLayout, { passive: true });

    const resizeObserver = new ResizeObserver(scheduleRefreshLayout);
    resizeObserver.observe(matrixScroller);
    const mainView = document.getElementById('main-view');
    if (mainView) {
        resizeObserver.observe(mainView);
    }

    scheduleRefreshLayout();

    fixedMatrixScrollbarCleanup = () => {
        if (layoutFrame) {
            window.cancelAnimationFrame(layoutFrame);
            layoutFrame = null;
        }
        matrixScroller.removeEventListener('scroll', syncFromMatrix);
        track.removeEventListener('scroll', syncFromDock);
        window.removeEventListener('resize', scheduleRefreshLayout);
        window.removeEventListener('scroll', scheduleRefreshLayout);
        resizeObserver.disconnect();
    };
}

function scheduleFixedMatrixScrollbarSetup() {
    cancelFixedMatrixScrollbarSetup();
    fixedMatrixScrollbarFrame = window.requestAnimationFrame(() => {
        fixedMatrixScrollbarFrame = null;
        setupFixedMatrixScrollbar();
    });
}

function render() {
    if (window.innerWidth >= 1024 && state.mobileMenuOpen) {
        state.mobileMenuOpen = false;
    }

    setShellVisibility(isAdminSession());
    updateSyncIndicator();
    if (!state.statusSelectionMode) {
        clearStatusSelectionHelp();
    }

    if (!state.authReady) {
        teardownFixedMatrixScrollbar();
        const authView = document.getElementById('auth-view');
        authView.innerHTML = `
            <div class="min-h-screen px-4 py-10 flex items-center justify-center">
                <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i>
                    Conectando ao Supabase...
                </div>
            </div>
        `;
        authView.classList.remove('hidden');
        document.getElementById('app-shell').classList.add('hidden');
        lucide.createIcons();
        return;
    }

    updateSessionLabels();
    updateNavigationVisibility();
    updateSidebarState();
    updateMobileMenuState();
    const globalSearchInput = document.getElementById('global-search');
    if (globalSearchInput && globalSearchInput.value !== state.searchQuery) {
        globalSearchInput.value = state.searchQuery;
    }

    const container = document.getElementById('main-view');
    if (!state.hasLoadedOnce && isPending('loadData')) {
        teardownFixedMatrixScrollbar();
        renderInitialLoading(container);
        lucide.createIcons();
        return;
    }
    const previousScroll = captureScrollPositions();
    container.innerHTML = '';
    state.currentViewAnimationClass = state.skipNextViewAnimation ? '' : 'animate-fade-in';
    state.skipNextViewAnimation = false;

    if (!isAdminSession()) {
        renderPublicOverview(container);
    } else if (state.activeTab === 'public-overview') {
        renderPublicOverview(container);
    } else if (state.activeTab === 'dashboard') {
        renderDashboard(container);
    } else if (state.activeTab === 'categories') {
        renderCategories(container);
    } else if (state.activeTab === 'report') {
        renderReport(container);
    } else if (state.activeTab === 'users') {
        renderUsers(container);
    } else if (state.activeTab === 'category-detail') {
        renderCategoryDetail(container);
    } else {
        renderDashboard(container);
    }

    lucide.createIcons();
    animateDashboardIndicators();
    if (typeof initializeDashboardPieInteractions === 'function') {
        initializeDashboardPieInteractions();
    }
    restoreScrollPositions(previousScroll);
    scheduleFixedMatrixScrollbarSetup();
    applyFlashCells();
}

function applyFlashCells() {
    if (!state.savedFlashKeys.size) {
        return;
    }
    const keys = state.savedFlashKeys;
    state.savedFlashKeys = new Set();
    window.requestAnimationFrame(() => {
        keys.forEach((key) => {
            const [userId, categoryId, moduleId] = key.split('::');
            const el = document.querySelector(
                `[data-status-user-id="${CSS.escape(userId)}"][data-status-category-id="${CSS.escape(categoryId)}"][data-status-module-id="${CSS.escape(moduleId)}"]`
            );
            if (el) {
                el.classList.remove('cell-saved-flash');
                void el.offsetWidth;
                el.classList.add('cell-saved-flash');
            }
        });
    });
}

function renderInitialLoading(container) {
    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            <div class="space-y-2">
                <div class="h-8 w-64 rounded-xl bg-slate-200/70 animate-pulse"></div>
                <div class="h-4 w-80 rounded-lg bg-slate-100 animate-pulse"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${Array.from({ length: 4 }).map(() => `
                    <div class="p-5 rounded-2xl border border-slate-100 bg-white">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-xl bg-indigo-100/70 animate-pulse"></div>
                            <div class="space-y-2 flex-1">
                                <div class="h-5 w-32 rounded-lg bg-slate-200 animate-pulse"></div>
                                <div class="h-3 w-44 rounded-lg bg-slate-100 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i>
                Carregando dados...
            </div>
        </div>
    `;
}
function renderAuthView(messageHtml) {
    const authView = document.getElementById('auth-view');
    const publicUsers = getPublicUsersWithProgress().filter((user) => user.completedModules > 0);
    const completedModulesTotal = publicUsers.reduce((sum, user) => sum + user.completedModules, 0);
    const avgProgress = publicUsers.length
        ? Math.round(publicUsers.reduce((sum, user) => sum + user.progress, 0) / publicUsers.length)
        : 0;

    authView.innerHTML = `
        <div class="min-h-screen px-4 py-10 flex items-center justify-center">
            <div class="w-full max-w-6xl grid lg:grid-cols-[1.25fr_0.75fr] gap-8 items-start">
                <div class="space-y-6">
                    <div class="space-y-6">
                        <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold">
                            <i data-lucide="database" class="w-4 h-4"></i>
                            Portal em modo consulta pública
                        </div>
                        <div class="space-y-4">
                            <h1 class="text-5xl font-black tracking-tight text-slate-900">Portal de Treinamentos</h1>
                            <p class="text-lg text-slate-600 max-w-xl">
                                Consulte os colaboradores treinados sem login. O acesso administrativo continua disponível ao lado.
                            </p>
                        </div>
                        <div class="grid sm:grid-cols-3 gap-4">
                            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                                <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Treinados</p>
                                <p class="mt-3 text-3xl font-black text-slate-800">${publicUsers.length}</p>
                                <p class="mt-1 text-xs text-slate-500">colaboradores com conclusão</p>
                            </div>
                            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                                <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Conclusões</p>
                                <p class="mt-3 text-3xl font-black text-slate-800">${completedModulesTotal}</p>
                                <p class="mt-1 text-xs text-slate-500">módulos concluídos</p>
                            </div>
                            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                                <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Média</p>
                                <p class="mt-3 text-3xl font-black text-slate-800">${avgProgress}%</p>
                                <p class="mt-1 text-xs text-slate-500">de progresso geral</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Usuários treinados</h3>
                            <span class="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                Somente leitura
                            </span>
                        </div>
                        ${(isPending('loadData') && !state.hasLoadedOnce) ? `
                            <div class="p-6 space-y-3">
                                ${Array.from({ length: 5 }).map(() => `
                                    <div class="h-10 rounded-xl bg-slate-100 animate-pulse"></div>
                                `).join('')}
                            </div>
                        ` : publicUsers.length ? `
                            <div class="lg:hidden p-4 space-y-3 bg-slate-50/60">
                                ${publicUsers.map((user) => `
                                    <article class="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
                                        <div>
                                            <p class="text-sm font-bold text-slate-800 truncate">${escapeHtml(user.fullName)}</p>
                                            <p class="text-[10px] text-slate-400 font-bold uppercase">${escapeHtml(user.role)}</p>
                                        </div>
                                        <div>
                                            <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                                <span>${user.completedModules}/${user.totalModules || user.completedModules}</span>
                                                <span>${user.progress}%</span>
                                            </div>
                                            <div class="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" style="width:${Math.min(100, Math.max(0, user.progress))}%;"></div>
                                            </div>
                                        </div>
                                        <div class="text-xs text-slate-500">
                                            ${user.completedCategories.length
                                                ? user.completedCategories.map((category) => `<span class="inline-flex mr-1 mb-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">${escapeHtml(category)}</span>`).join('')
                                                : '<span class="text-slate-400">-</span>'}
                                        </div>
                                    </article>
                                `).join('')}
                            </div>
                            <div class="hidden lg:block fixed-scroll-target max-h-[360px] overflow-auto" data-scroll-key="auth-trained-users-table">
                                <table class="w-full min-w-max text-left">
                                    <thead class="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Nome</th>
                                            <th class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Cargo</th>
                                            <th class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Conclusão</th>
                                            <th class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Categorias</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        ${publicUsers.map((user) => `
                                            <tr>
                                                <td class="px-4 py-2.5">
                                                    <p class="text-[13px] font-bold text-slate-800">${escapeHtml(user.fullName)}</p>
                                                </td>
                                                <td class="px-4 py-2.5 text-[13px] text-slate-500">${escapeHtml(user.role)}</td>
                                                <td class="px-4 py-2.5">
                                                    <div class="min-w-[132px]">
                                                        <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                                            <span>${user.completedModules}/${user.totalModules || user.completedModules}</span>
                                                            <span>${user.progress}%</span>
                                                        </div>
                                                        <div class="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                            <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" style="width:${Math.min(100, Math.max(0, user.progress))}%;"></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-4 py-2.5 text-[11px] text-slate-500">
                                                    ${user.completedCategories.length
                                                        ? user.completedCategories.map((category) => `<span class="inline-flex mr-1 mb-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">${escapeHtml(category)}</span>`).join('')
                                                        : '<span class="text-slate-400">-</span>'}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="p-8 text-sm text-slate-500">
                                Nenhum usuário treinado encontrado no momento.
                            </div>
                        `}
                        ${state.publicDataError ? `
                            <div class="px-6 py-3 border-t border-red-100 bg-red-50 text-xs font-semibold text-red-700">
                                ${escapeHtml(state.publicDataError)}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="bg-white rounded-[32px] shadow-xl shadow-slate-200/60 border border-slate-200 p-8 lg:p-10">
                    <div class="space-y-2 mb-8">
                        <p class="text-xs font-black uppercase tracking-[0.28em] text-indigo-500">Acesso Administrativo</p>
                        <h2 class="text-3xl font-black text-slate-900">Entrar</h2>
                        ${messageHtml}
                    </div>
                    <form class="space-y-5" onsubmit="login(event)">
                        <div>
                            <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">E-mail</label>
                            <input id="login-email" type="email" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="admin@empresa.com" required>
                        </div>
                        <div>
                            <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">Senha</label>
                            <div class="relative">
                                <input id="login-password" type="password" class="w-full px-4 py-3 pr-11 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="Sua senha" required>
                                <button type="button" onclick="togglePasswordVisibility('login-password', this)" class="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg" aria-label="Mostrar senha">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                        <button type="button" onclick="requestPasswordReset()" class="w-full text-sm font-bold text-indigo-600 hover:text-indigo-700">
                            Esqueci minha senha
                        </button>
                        <button id="login-submit-btn" class="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                            Entrar no painel
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();
}

function updateSessionLabels() {
    const email = state.session?.user?.email || 'Visitante';
    const headerModeTitle = document.getElementById('header-mode-title');
    const headerEmail = document.getElementById('header-session-email');

    document.querySelectorAll('[data-session-email]').forEach((element) => {
        element.textContent = isAdminSession() ? email : 'Consulta pública';
    });
    if (headerEmail) {
        headerEmail.textContent = isAdminSession() ? email : 'Consulta pública';
    }
    if (headerModeTitle) {
        headerModeTitle.textContent = isAdminSession() ? 'Painel Administrativo' : 'Portal de Treinamentos';
    }
}

function updateNavigationVisibility() {
    const isAuthenticated = isAdminSession();
    document.querySelectorAll('.admin-only').forEach((element) => {
        element.classList.toggle('hidden', !isAuthenticated);
    });
    document.querySelectorAll('.public-only').forEach((element) => {
        element.classList.toggle('hidden', isAuthenticated);
    });
    if (isAuthenticated) {
        document.querySelectorAll('[data-nav-tab="public-overview"]').forEach((element) => {
            element.classList.remove('hidden');
        });
    }
}

function updateSyncIndicator() {
    const indicator = document.getElementById('sync-indicator');
    if (!indicator) {
        return;
    }

    const isWorking = (isPending('loadData') && !state.hasLoadedOnce)
        || isPending('auth')
        || isPending('saveCategory')
        || isPending('saveUser')
        || isPending('importUsers')
        || isPending('normalizeRoles')
        || isPending('saveStatus')
        || isPending('deleteCategory')
        || isPending('deleteUser');

    if (!isWorking) {
        indicator.classList.add('hidden');
        indicator.textContent = '';
        return;
    }

    indicator.classList.remove('hidden');
    if (isPending('loadData')) {
        indicator.textContent = 'Sincronizando...';
    } else if (isPending('importUsers')) {
        indicator.textContent = 'Importando CSV...';
    } else if (isPending('normalizeRoles')) {
        indicator.textContent = 'Padronizando cargos...';
    } else {
        indicator.textContent = 'Salvando alterações...';
    }
}

function updateSidebarState() {
    document.querySelectorAll('.sidebar-btn').forEach((button) => button.classList.remove('sidebar-active'));
    const activeTab = state.activeTab === 'category-detail' ? 'categories' : state.activeTab;
    document.querySelectorAll(`[data-nav-tab="${activeTab}"]`).forEach((button) => {
        button.classList.add('sidebar-active');
    });
}

function updateMobileMenuState() {
    const overlay = document.getElementById('mobile-menu-overlay');
    if (!overlay) {
        return;
    }

    const canOpenMobileMenu = window.innerWidth < 1024;
    const isOpen = Boolean(state.mobileMenuOpen) && canOpenMobileMenu;
    overlay.dataset.open = isOpen ? 'true' : 'false';
    overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.body.classList.toggle('menu-open', isOpen);
}

function closeMobileMenu() {
    if (!state.mobileMenuOpen) {
        updateMobileMenuState();
        return;
    }

    state.mobileMenuOpen = false;
    updateMobileMenuState();
}

function toggleMobileMenu() {
    if (window.innerWidth >= 1024) {
        state.mobileMenuOpen = false;
        updateMobileMenuState();
        return;
    }

    state.mobileMenuOpen = !state.mobileMenuOpen;
    updateMobileMenuState();
}

function switchTabFromMenu(tabId) {
    switchTab(tabId);
    closeMobileMenu();
}

window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && state.mobileMenuOpen) {
        state.mobileMenuOpen = false;
    }
    updateMobileMenuState();
});

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
        return;
    }
    if (!state.mobileMenuOpen) {
        return;
    }
    closeMobileMenu();
});
