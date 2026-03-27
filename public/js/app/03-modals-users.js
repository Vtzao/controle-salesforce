function openModal(type, id = null) {
    state.currentEditingType = type;
    state.currentEditingId = id;

    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');

    if (type === 'category') {
        const category = state.categories.find((item) => item.id === id);
        state.tempModules = category
            ? category.modules.map((module) => ({ id: module.id, name: module.name }))
            : [{ id: null, name: '' }];

        title.textContent = category ? 'Editar Categoria' : 'Nova Categoria';
        content.innerHTML = `
            <div class="space-y-6">
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome</label>
                    <input id="cat-name" type="text" value="${escapeAttr(category?.name || '')}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400">
                </div>
                <div class="space-y-3">
                    <div class="flex items-center justify-between gap-4">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulos</label>
                        <button onclick="addModuleField()" class="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                            Adicionar módulo
                        </button>
                    </div>
                    <div id="module-list" class="space-y-2"></div>
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                    <button onclick="closeModal()" class="w-full sm:w-40 py-3 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50">
                        Cancelar
                    </button>
                    <button id="category-save-btn" onclick="saveCategory()" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
                        Salvar categoria
                    </button>
                </div>
            </div>
        `;
        refreshModuleList();
    } else if (type === 'user') {
        const user = state.users.find((item) => item.id === id);
        state.tempAssignedCategoryIds = user ? [...user.categoryIds] : [];
        title.textContent = user ? 'Editar Usuário' : 'Novo Usuário';

        content.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                        <input id="user-fname" value="${escapeAttr(user?.firstName || '')}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Sobrenome</label>
                        <input id="user-lname" value="${escapeAttr(user?.lastName || '')}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Cargo</label>
                        <input id="user-role" value="${escapeAttr(user?.role || '')}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">ID do Usuário (opcional)</label>
                        <input id="user-external-id" value="${escapeAttr(user?.externalId || '')}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none" placeholder="Deixe em branco para gerar automaticamente">
                    </div>
                </div>

                <div class="pt-4 border-t space-y-3">
                    <label class="text-[10px] font-bold text-slate-400 uppercase block">Categorias vinculadas</label>
                    <div id="user-category-list" class="flex flex-wrap gap-2"></div>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 pt-2">
                    <button onclick="closeModal()" class="w-full sm:w-40 py-3 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50">
                        Cancelar
                    </button>
                    <button id="user-save-btn" onclick="saveUser()" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
                        Salvar usuário
                    </button>
                </div>
            </div>
        `;
        refreshUserCategoryButtons();
    } else if (type === 'admin-login') {
        title.textContent = 'Painel de Admin';
        content.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-slate-500">Entre com um usuário administrador para liberar o CRUD completo.</p>
                <form class="space-y-4" onsubmit="login(event)">
                    <div>
                        <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">E-mail</label>
                        <input id="login-email" type="email" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="admin@empresa.com" required>
                    </div>
                    <div>
                        <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">Senha</label>
                        <input id="login-password" type="password" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="Sua senha" required>
                    </div>
                    <button id="login-submit-btn" class="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                        Entrar no painel
                    </button>
                </form>
            </div>
        `;
    }

    document.getElementById('modal-container').classList.remove('hidden');
    window.setTimeout(() => {
        const targetId = type === 'category'
            ? 'cat-name'
            : type === 'user'
                ? 'user-fname'
                : 'login-email';
        document.getElementById(targetId)?.focus();
    }, 0);
    lucide.createIcons();
}

function openAdminLoginModal() {
    if (isAdminSession()) {
        state.activeTab = 'dashboard';
        render();
        return;
    }
    openModal('admin-login');
}

function closeModal(force = false) {
    if (!force && (isPending('saveCategory') || isPending('saveUser'))) {
        return;
    }

    document.getElementById('modal-container').classList.add('hidden');
    state.currentEditingId = null;
    state.currentEditingType = null;
    state.tempModules = [];
    state.tempAssignedCategoryIds = [];
}

function addModuleField() {
    state.tempModules.push({ id: null, name: '' });
    refreshModuleList();
}

function updateTempModule(index, value) {
    if (!state.tempModules[index]) {
        return;
    }

    state.tempModules[index].name = value;
}

function removeModuleFromList(index) {
    state.tempModules.splice(index, 1);
    if (!state.tempModules.length) {
        state.tempModules.push({ id: null, name: '' });
    }
    refreshModuleList();
}

function refreshModuleList() {
    const list = document.getElementById('module-list');
    if (!list) {
        return;
    }

    list.innerHTML = state.tempModules.map((module, index) => `
        <div class="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
            <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-black shrink-0">
                ${index + 1}
            </div>
            <input type="text" value="${escapeAttr(module.name || '')}" oninput="updateTempModule(${index}, this.value)" class="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400" placeholder="Nome do módulo">
            <button onclick="removeModuleFromList(${index})" class="p-2 text-slate-300 hover:text-red-500 rounded-lg">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');

    lucide.createIcons();
}

function refreshUserCategoryButtons() {
    const list = document.getElementById('user-category-list');
    if (!list) {
        return;
    }

    list.innerHTML = state.categories.length
        ? state.categories.map((category) => {
            const active = state.tempAssignedCategoryIds.includes(category.id);
            return `
                <button onclick="toggleUserCat('${category.id}')" type="button" class="px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}">
                    ${escapeHtml(category.name)}
                </button>
            `;
        }).join('')
        : '<p class="text-sm text-slate-400">Crie uma categoria antes de vincular usuários.</p>';
}

function toggleUserCat(categoryId) {
    if (state.tempAssignedCategoryIds.includes(categoryId)) {
        state.tempAssignedCategoryIds = state.tempAssignedCategoryIds.filter((id) => id !== categoryId);
    } else {
        state.tempAssignedCategoryIds = [...state.tempAssignedCategoryIds, categoryId];
    }
    refreshUserCategoryButtons();
}

function setUserListCategoryFilter(categoryId) {
    state.userListFilters.categoryId = categoryId || 'all';
    renderSmooth();
}

function setUserListRoleFilter(role) {
    state.userListFilters.role = role || 'all';
    renderSmooth();
}

function setUserListSort(sort) {
    state.userListFilters.sort = sort || 'name-asc';
    renderSmooth();
}

function clearUserListFilters() {
    state.searchQuery = '';
    state.userListFilters = {
        categoryId: 'all',
        role: 'all',
        sort: 'name-asc',
    };
    renderSmooth();
}

function areCategorySetsEqual(leftIds, rightIds) {
    const left = [...new Set(leftIds)].sort();
    const right = [...new Set(rightIds)].sort();
    if (left.length !== right.length) {
        return false;
    }

    return left.every((id, index) => id === right[index]);
}

function ensureUserCategoryDraft(userId, originalCategoryIds) {
    if (!state.userCategoryDrafts[userId]) {
        state.userCategoryDrafts[userId] = {
            saving: false,
            originalCategoryIds: [...originalCategoryIds],
            draftCategoryIds: [...originalCategoryIds],
        };
    }

    return state.userCategoryDrafts[userId];
}

function getEffectiveUserCategoryIds(user) {
    const draft = state.userCategoryDrafts[user.id];
    if (!draft) {
        return user.categoryIds;
    }

    return draft.draftCategoryIds;
}

function isUserCategoryDraftDirty(userId) {
    const draft = state.userCategoryDrafts[userId];
    if (!draft) {
        return false;
    }

    return !areCategorySetsEqual(draft.originalCategoryIds, draft.draftCategoryIds);
}

function isUserCategoryDraftSaving(userId) {
    return Boolean(state.userCategoryDrafts[userId]?.saving);
}

function toggleUserCategoryQuick(userId, categoryId) {
    if (isPending('loadData') || isPending('importUsers') || isPending('deleteUser')) {
        return;
    }

    const user = state.users.find((item) => item.id === userId);
    if (!user) {
        return;
    }

    const draft = ensureUserCategoryDraft(userId, user.categoryIds);
    if (draft.saving) {
        return;
    }

    const nextCategoryIds = draft.draftCategoryIds.includes(categoryId)
        ? draft.draftCategoryIds.filter((id) => id !== categoryId)
        : [...draft.draftCategoryIds, categoryId];
    draft.draftCategoryIds = [...new Set(nextCategoryIds)];

    render();
}

function cancelUserCategoryQuickChanges(userId) {
    const draft = state.userCategoryDrafts[userId];
    if (!draft || draft.saving) {
        return;
    }

    delete state.userCategoryDrafts[userId];
    render();
}

async function saveUserCategoryQuickChanges(userId) {
    const draft = state.userCategoryDrafts[userId];
    if (!draft || draft.saving) {
        return;
    }

    const user = state.users.find((item) => item.id === userId);
    if (!user) {
        delete state.userCategoryDrafts[userId];
        return;
    }

    const targetCategoryIds = [...new Set(draft.draftCategoryIds)];
    if (areCategorySetsEqual(draft.originalCategoryIds, targetCategoryIds)) {
        delete state.userCategoryDrafts[userId];
        render();
        return;
    }

    draft.saving = true;
    render();

    try {
        ensureClient();

        if (!user.externalId) {
            user.externalId = `${normalizeComparisonKey(user.fullName || 'usuario') || 'usuario'}-${String(user.id || '').slice(0, 8) || Date.now().toString(36)}`;
        }

        if (state.rpcAvailability.saveCollaboratorWithCategories !== false) {
            const { error } = await supabaseClient.rpc('save_collaborator_with_categories', {
                p_collaborator_id: user.id,
                p_external_id: user.externalId,
                p_name: user.fullName,
                p_role: user.role,
                p_category_ids: targetCategoryIds,
            });

            if (error) {
                if (isRpcMissing(error, 'save_collaborator_with_categories')) {
                    state.rpcAvailability.saveCollaboratorWithCategories = false;
                    await syncUserCategories(user.id, draft.originalCategoryIds, targetCategoryIds);
                } else {
                    throw error;
                }
            } else {
                state.rpcAvailability.saveCollaboratorWithCategories = true;
            }
        } else {
            await syncUserCategories(user.id, draft.originalCategoryIds, targetCategoryIds);
        }

        user.categoryIds = [...targetCategoryIds];
        delete state.userCategoryDrafts[userId];
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível atualizar as categorias do usuário.'), 'error');
    } finally {
        if (state.userCategoryDrafts[userId]) {
            state.userCategoryDrafts[userId].saving = false;
        }
    }

    render();
}

async function loadAppData(options = {}) {
    const showErrorToast = options.showErrorToast !== false;
    if (loadDataPromise) {
        return loadDataPromise;
    }

    loadDataPromise = (async () => {
        setPending('loadData', true);
        try {
            ensureClient();
            const [
                categoriesResponse,
                modulesResponse,
                collaboratorsResponse,
                collaboratorCategoriesResponse,
                statusResponse,
            ] = await withTimeout(
                Promise.all([
                    supabaseClient.from('categories').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
                    supabaseClient.from('modules').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
                    supabaseClient.from('collaborators').select('*').order('name', { ascending: true }),
                    supabaseClient.from('collaborator_categories').select('*'),
                    supabaseClient.from('collaborator_module_status').select('*'),
                ]),
                15000,
                'Tempo limite atingido ao sincronizar os dados.'
            );

            const errors = [
                categoriesResponse.error,
                modulesResponse.error,
                collaboratorsResponse.error,
                collaboratorCategoriesResponse.error,
                statusResponse.error,
            ].filter(Boolean);

            if (errors.length) {
                throw errors[0];
            }

            const modulesByCategoryId = {};
            for (const module of modulesResponse.data || []) {
                if (!modulesByCategoryId[module.category_id]) {
                    modulesByCategoryId[module.category_id] = [];
                }
                modulesByCategoryId[module.category_id].push(module);
            }

            state.categories = (categoriesResponse.data || []).map((category) => ({
                ...category,
                modules: modulesByCategoryId[category.id] || [],
            }));

            const categoryIdsByCollaborator = {};
            for (const row of collaboratorCategoriesResponse.data || []) {
                if (!categoryIdsByCollaborator[row.collaborator_id]) {
                    categoryIdsByCollaborator[row.collaborator_id] = [];
                }
                categoryIdsByCollaborator[row.collaborator_id].push(row.category_id);
            }

            const moduleById = Object.fromEntries(
                (modulesResponse.data || []).map((module) => [module.id, module])
            );
            const statusByCollaborator = {};
            const completedByCollaborator = {};

            for (const row of statusResponse.data || []) {
                const module = moduleById[row.module_id];
                if (!module) {
                    continue;
                }
                const normalizedStatus = normalizeModuleStatus(row.status);

                if (!statusByCollaborator[row.collaborator_id]) {
                    statusByCollaborator[row.collaborator_id] = {};
                }
                statusByCollaborator[row.collaborator_id][module.id] = normalizedStatus;

                if (normalizedStatus !== MODULE_STATUS.COMPLETED) {
                    continue;
                }

                if (!completedByCollaborator[row.collaborator_id]) {
                    completedByCollaborator[row.collaborator_id] = {};
                }
                if (!completedByCollaborator[row.collaborator_id][module.category_id]) {
                    completedByCollaborator[row.collaborator_id][module.category_id] = [];
                }

                completedByCollaborator[row.collaborator_id][module.category_id].push(module.id);
            }

            state.users = (collaboratorsResponse.data || []).map((collaborator) => {
                const nameParts = splitName(collaborator.name);
                return {
                    id: collaborator.id,
                    externalId: collaborator.external_id,
                    role: normalizeRoleLabel(collaborator.role),
                    firstName: nameParts.firstName,
                    lastName: nameParts.lastName,
                    fullName: collaborator.name,
                    categoryIds: categoryIdsByCollaborator[collaborator.id] || [],
                    moduleStatuses: statusByCollaborator[collaborator.id] || {},
                    completedModuleIds: completedByCollaborator[collaborator.id] || {},
                };
            });
            state.publicDataError = '';
            state.userCategoryDrafts = {};
            state.statusDraft = {};
            clearStatusSelection();
            state.statusSelectionMode = false;

            if (state.activeTab === 'category-detail' && !getCurrentCategory()) {
                state.activeTab = 'categories';
                state.selectedCategoryId = null;
            }
            if (state.expandedCategoryId && !state.categories.find((category) => category.id === state.expandedCategoryId)) {
                state.expandedCategoryId = null;
            }
            if (
                state.inlineModuleEditor.categoryId
                && !state.categories.find((category) => category.id === state.inlineModuleEditor.categoryId)
            ) {
                state.inlineModuleEditor = { categoryId: null, modules: [], editingIndex: null };
            }

            render();
        } catch (error) {
            const friendlyError = toUserFriendlyError(error, 'Não foi possível carregar os dados.');
            if (showErrorToast) {
                showToast(friendlyError, 'error');
            }
            if (!isAdminSession()) {
                state.publicDataError = friendlyError;
                render();
            }
        } finally {
            state.hasLoadedOnce = true;
            setPending('loadData', false);
            loadDataPromise = null;
        }
    })();

    return loadDataPromise;
}

async function login(event) {
    event.preventDefault();
    if (isPending('auth')) {
        return;
    }

    setPending('auth', true);
    setButtonLoading('login-submit-btn', true, 'Entrando...');
    try {
        ensureClient();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            throw error;
        }

        state.activeTab = 'dashboard';
        closeModal(true);
        showToast('Login realizado com sucesso.');
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Falha ao autenticar.'), 'error');
    } finally {
        setPending('auth', false);
        setButtonLoading('login-submit-btn', false);
    }
}

async function logout() {
    if (isPending('auth')) {
        return;
    }

    setPending('auth', true);
    try {
        ensureClient();
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            throw error;
        }

        state.categories = [];
        state.users = [];
        state.publicDataError = '';
        state.userCategoryDrafts = {};
        state.statusDraft = {};
        clearStatusSelection();
        state.statusSelectionMode = false;
        state.selectedCategoryId = null;
        state.expandedCategoryId = null;
        state.inlineModuleEditor = { categoryId: null, modules: [], editingIndex: null };
        state.hasLoadedOnce = false;
        state.activeTab = 'public-overview';
        showToast('Sessão encerrada.', 'info');
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Falha ao encerrar sessão.'), 'error');
    } finally {
        setPending('auth', false);
    }
}


