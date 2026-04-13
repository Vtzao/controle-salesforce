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
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Cargo</label>
                        <input id="user-role" value="${escapeAttr(user?.role || '')}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">E-mail</label>
                        <input id="user-email" type="email" value="${escapeAttr(user?.email || '')}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none" placeholder="usuario@empresa.com">
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
                <div class="flex justify-center pb-1">
                    <img src="./img/logo-preto.png" alt="Logo Orgadata" class="h-14 w-auto object-contain" loading="eager" decoding="async">
                </div>
                <p class="text-sm text-slate-500">Entre com um usuário administrador para liberar o CRUD completo.</p>
                <form class="space-y-4" onsubmit="login(event)">
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
        `;
    } else if (type === 'admin-create') {
        title.textContent = 'Criar Usuário Admin';
        content.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-slate-500">Crie um novo acesso administrativo para o portal.</p>
                <div>
                    <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">E-mail do admin</label>
                    <input id="admin-create-email" type="email" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="novo-admin@empresa.com" required>
                </div>
                <div>
                    <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">Senha</label>
                    <div class="relative">
                        <input id="admin-create-password" type="password" class="w-full px-4 py-3 pr-11 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="Mínimo 8 caracteres" required>
                        <button type="button" onclick="togglePasswordVisibility('admin-create-password', this)" class="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg" aria-label="Mostrar senha">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">Confirmar senha</label>
                    <div class="relative">
                        <input id="admin-create-password-confirm" type="password" class="w-full px-4 py-3 pr-11 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="Repita a senha" required>
                        <button type="button" onclick="togglePasswordVisibility('admin-create-password-confirm', this)" class="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg" aria-label="Mostrar senha">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 pt-1">
                    <button type="button" onclick="closeModal()" class="w-full sm:w-40 py-3 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50">
                        Cancelar
                    </button>
                    <button id="admin-create-save-btn" type="button" onclick="createAdminUserAccount()" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
                        Criar Admin
                    </button>
                </div>
            </div>
        `;
    } else if (type === 'admin-edit') {
        if (!isAdminSession()) {
            showToast('Apenas administradores podem editar admins.', 'error');
            return;
        }

        const admin = state.admins.find((item) => item.id === id);
        if (!admin) {
            showToast('Admin não encontrado.', 'error');
            return;
        }

        const isSelf = admin.email === state.session?.user?.email;
        if (isSelf) {
            showToast('Você não pode editar seu próprio registro aqui.', 'info');
            return;
        }

        title.textContent = 'Editar Admin';
        content.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-slate-500">Atualize o e-mail de acesso administrativo.</p>
                <div>
                    <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">E-mail do admin</label>
                    <input id="admin-edit-email" type="email" value="${escapeAttr(admin.email || '')}" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="admin@empresa.com" required>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 pt-1">
                    <button type="button" onclick="closeModal()" class="w-full sm:w-40 py-3 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50">
                        Cancelar
                    </button>
                    <button id="admin-edit-save-btn" type="button" onclick="updateAdminRecord('${escapeAttr(admin.id)}')" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
                        Salvar alterações
                    </button>
                </div>
            </div>
        `;
    } else if (type === 'password-recovery') {
        title.textContent = 'Redefinir Senha';
        content.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-slate-500">Defina sua nova senha para concluir a recuperação de acesso.</p>
                <div>
                    <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">Nova senha</label>
                    <div class="relative">
                        <input id="recovery-password" type="password" class="w-full px-4 py-3 pr-11 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="Mínimo 8 caracteres" required>
                        <button type="button" onclick="togglePasswordVisibility('recovery-password', this)" class="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg" aria-label="Mostrar senha">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">Confirmar nova senha</label>
                    <div class="relative">
                        <input id="recovery-password-confirm" type="password" class="w-full px-4 py-3 pr-11 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="Repita a senha" required>
                        <button type="button" onclick="togglePasswordVisibility('recovery-password-confirm', this)" class="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg" aria-label="Mostrar senha">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 pt-1">
                    <button type="button" onclick="closeModal()" class="w-full sm:w-40 py-3 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50">
                        Cancelar
                    </button>
                    <button id="recovery-save-btn" type="button" onclick="completePasswordRecovery()" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
                        Salvar nova senha
                    </button>
                </div>
            </div>
        `;
    } else if (type === 'change-password') {
        if (!isAdminSession()) {
            showToast('Faça login como admin para alterar a senha.', 'error');
            return;
        }
        title.textContent = 'Alterar Minha Senha';
        content.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-slate-500">Defina uma nova senha para sua conta atual.</p>
                <div>
                    <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">Nova senha</label>
                    <div class="relative">
                        <input id="change-password" type="password" class="w-full px-4 py-3 pr-11 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="Mínimo 8 caracteres" required>
                        <button type="button" onclick="togglePasswordVisibility('change-password', this)" class="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg" aria-label="Mostrar senha">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-[11px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">Confirmar nova senha</label>
                    <div class="relative">
                        <input id="change-password-confirm" type="password" class="w-full px-4 py-3 pr-11 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" placeholder="Repita a senha" required>
                        <button type="button" onclick="togglePasswordVisibility('change-password-confirm', this)" class="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg" aria-label="Mostrar senha">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 pt-1">
                    <button type="button" onclick="closeModal()" class="w-full sm:w-40 py-3 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50">
                        Cancelar
                    </button>
                    <button id="change-password-save-btn" type="button" onclick="changeOwnPassword()" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
                        Salvar nova senha
                    </button>
                </div>
            </div>
        `;
    }

    document.getElementById('modal-container').classList.remove('hidden');
    window.setTimeout(() => {
        const targetId = type === 'category'
            ? 'cat-name'
            : type === 'user'
                ? 'user-fname'
                : type === 'admin-create'
                    ? 'admin-create-email'
                    : type === 'admin-edit'
                        ? 'admin-edit-email'
                    : type === 'password-recovery'
                        ? 'recovery-password'
                        : type === 'change-password'
                            ? 'change-password'
                        : 'login-email';
        document.getElementById(targetId)?.focus();
    }, 0);
    lucide.createIcons();
    applyModalSubmitShortcut(type, id);
}

function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input || !button) {
        return;
    }

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    button.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
    button.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
    lucide.createIcons();
    input.focus();
}

function getModalSubmitAction(type, id) {
    if (type === 'user') {
        return saveUser;
    }
    if (type === 'admin-create') {
        return createAdminUserAccount;
    }
    if (type === 'admin-edit') {
        return () => updateAdminRecord(id);
    }
    if (type === 'password-recovery') {
        return completePasswordRecovery;
    }
    if (type === 'change-password') {
        return changeOwnPassword;
    }
    return null;
}

function applyModalSubmitShortcut(type, id) {
    const content = document.getElementById('modal-content');
    if (!content) {
        return;
    }

    const action = getModalSubmitAction(type, id);
    if (!action) {
        content.onkeydown = null;
        return;
    }

    content.onkeydown = (event) => {
        if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }

        const target = event.target;
        const tagName = String(target?.tagName || '').toLowerCase();
        const inputType = String(target?.type || '').toLowerCase();
        if (tagName === 'textarea' || inputType === 'button' || inputType === 'submit' || inputType === 'file') {
            return;
        }

        event.preventDefault();
        action();
    };
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
    const content = document.getElementById('modal-content');
    if (content) {
        content.onkeydown = null;
    }
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

function setUserListActiveFilter(active) {
    state.userListFilters.active = active || 'all';
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
        active: 'all',
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

function getUserCategoryDraftStats() {
    let dirty = 0;
    let saving = 0;

    for (const draft of Object.values(state.userCategoryDrafts)) {
        if (!draft) {
            continue;
        }
        if (draft.saving) {
            saving += 1;
        }
        if (!areCategorySetsEqual(draft.originalCategoryIds, draft.draftCategoryIds)) {
            dirty += 1;
        }
    }

    return { dirty, saving };
}

function isAnyUserCategoryDraftSaving() {
    return getUserCategoryDraftStats().saving > 0;
}

function getDirtyUserCategoryDraftEntries(targetUserId = null) {
    return Object.entries(state.userCategoryDrafts)
        .filter(([userId, draft]) => {
            if (!draft || draft.saving) {
                return false;
            }
            if (targetUserId && userId !== targetUserId) {
                return false;
            }
            return !areCategorySetsEqual(draft.originalCategoryIds, draft.draftCategoryIds);
        })
        .map(([userId, draft]) => ({ userId, draft }));
}

function toggleUserCategoryQuick(userId, categoryId) {
    if (isPending('loadData') || isPending('importUsers') || isPending('deleteUser') || isAnyUserCategoryDraftSaving()) {
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
    if (isAnyUserCategoryDraftSaving()) {
        return;
    }

    if (userId) {
        const draft = state.userCategoryDrafts[userId];
        if (!draft) {
            return;
        }
        delete state.userCategoryDrafts[userId];
    } else {
        state.userCategoryDrafts = {};
    }

    render();
}

async function persistSingleUserCategoryQuickDraft(userId, draft) {
    const user = state.users.find((item) => item.id === userId);
    if (!user) {
        delete state.userCategoryDrafts[userId];
        return false;
    }

    const targetCategoryIds = [...new Set(draft.draftCategoryIds)];
    if (areCategorySetsEqual(draft.originalCategoryIds, targetCategoryIds)) {
        delete state.userCategoryDrafts[userId];
        return false;
    }

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
            p_email: user.email || null,
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
    return true;
}

async function saveUserCategoryQuickChanges(userId) {
    if (isPending('loadData') || isPending('importUsers') || isPending('deleteUser')) {
        return;
    }

    const targetUserId = userId || null;
    const draftEntries = getDirtyUserCategoryDraftEntries(targetUserId);
    if (!draftEntries.length) {
        if (!targetUserId) {
            showToast('Não há alterações de categorias para salvar.', 'info');
        }
        render();
        return;
    }

    for (const entry of draftEntries) {
        entry.draft.saving = true;
    }
    render();

    let updatedCount = 0;
    let failedCount = 0;

    for (const entry of draftEntries) {
        try {
            const updated = await persistSingleUserCategoryQuickDraft(entry.userId, entry.draft);
            if (updated) {
                updatedCount += 1;
            }
        } catch (error) {
            failedCount += 1;
            if (state.userCategoryDrafts[entry.userId]) {
                state.userCategoryDrafts[entry.userId].saving = false;
            }
            if (targetUserId) {
                showToast(toUserFriendlyError(error, 'Não foi possível atualizar as categorias do usuário.'), 'error');
            } else {
                console.error(`Falha ao atualizar categorias do usuário ${entry.userId}`, error);
            }
        }
    }

    if (!targetUserId) {
        if (failedCount) {
            showToast(
                `Alterações em categorias: ${updatedCount} usuário(s) salvo(s), ${failedCount} com erro.`,
                'error'
            );
        } else if (updatedCount) {
            showToast(
                `${updatedCount} usuário(s) com categorias atualizados com sucesso.`,
                'success'
            );
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
                    email: String(collaborator.email || '').trim().toLowerCase(),
                    isActive: collaborator.is_active !== false,
                    role: normalizeRoleLabel(collaborator.role),
                    firstName: nameParts.firstName,
                    lastName: nameParts.lastName,
                    fullName: collaborator.name,
                    categoryIds: categoryIdsByCollaborator[collaborator.id] || [],
                    moduleStatuses: statusByCollaborator[collaborator.id] || {},
                    completedModuleIds: completedByCollaborator[collaborator.id] || {},
                };
            });
            pruneUserBulkSelection();
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

            await loadAdmins().catch(() => {});
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

        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (sessionData?.session) {
            state.session = sessionData.session;
            state.authReady = true;
        }

        await loadAppData({ showErrorToast: true });
        await logPortalAuditEvent('admin_login_success', { email });
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

async function logPortalAuditEvent(eventName, payload = {}) {
    try {
        ensureClient();
        await supabaseClient.rpc('log_portal_event', {
            p_event: eventName,
            p_payload: payload,
        });
    } catch (_error) {
        // Best-effort event log. Never block UX on audit write failures.
    }
}

async function requestPasswordReset() {
    if (isPending('auth')) {
        return;
    }

    const email = (document.getElementById('login-email')?.value || '').trim();
    if (!email) {
        showToast('Informe o e-mail para recuperar a senha.', 'info');
        return;
    }

    setPending('auth', true);
    try {
        ensureClient();
        const redirectTo = `${window.location.origin}${window.location.pathname}#recovery`;
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) {
            throw error;
        }

        showToast('Enviamos o link de recuperação para seu e-mail.', 'success');
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível enviar o e-mail de recuperação.'), 'error');
    } finally {
        setPending('auth', false);
    }
}

async function getSupabaseAuthSettings() {
    try {
        const config = window.SUPABASE_CONFIG || {};
        if (!config.url || !config.anonKey) {
            return null;
        }

        const response = await fetch(`${config.url}/auth/v1/settings`, {
            method: 'GET',
            headers: {
                apikey: config.anonKey,
                Authorization: `Bearer ${config.anonKey}`,
            },
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (_error) {
        return null;
    }
}

async function createAdminUserAccount() {
    if (!isAdminSession()) {
        showToast('Apenas administradores podem criar novos admins.', 'error');
        return;
    }

    if (isPending('auth')) {
        return;
    }

    const email = (document.getElementById('admin-create-email')?.value || '').trim();
    const password = document.getElementById('admin-create-password')?.value || '';
    const passwordConfirm = document.getElementById('admin-create-password-confirm')?.value || '';

    if (!email) {
        showToast('Informe o e-mail do novo admin.', 'error');
        return;
    }
    if (password.length < 8) {
        showToast('A senha precisa ter no mínimo 8 caracteres.', 'error');
        return;
    }
    if (password !== passwordConfirm) {
        showToast('A confirmação da senha não confere.', 'error');
        return;
    }

    const currentSession = state.session
        ? {
            access_token: state.session.access_token,
            refresh_token: state.session.refresh_token,
            user_id: state.session.user?.id || null,
        }
        : null;

    const loadingStartedAt = Date.now();
    setPending('auth', true);
    setButtonLoading('admin-create-save-btn', true, 'Criando...');
    try {
        ensureClient();
        state.suppressAuthStateReactions = true;
        const authSettings = await getSupabaseAuthSettings();
        if (!authSettings) {
            throw new Error('Não foi possível validar as configurações de autenticação do Supabase. Tente novamente.');
        }
        if (authSettings.mailer_autoconfirm !== true) {
            throw new Error('Para criar o admin já ativo, desative "Confirm email" em Supabase > Authentication > Providers > Email.');
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'admin',
                    created_by: state.session?.user?.email || null,
                },
            },
        });
        if (error) {
            throw error;
        }
        if (!data?.session) {
            throw new Error('O Supabase ainda está exigindo confirmação por e-mail. Desative "Confirm email" e tente novamente.');
        }

        if (currentSession && data?.session && data.session.user?.id !== currentSession.user_id) {
            const { error: restoreError } = await supabaseClient.auth.setSession({
                access_token: currentSession.access_token,
                refresh_token: currentSession.refresh_token,
            });
            if (restoreError) {
                throw restoreError;
            }
        }

        // Register in portal_admins table (best-effort)
        try {
            await supabaseClient.from('portal_admins').upsert({ email, created_by: state.session?.user?.email || null }, { onConflict: 'email' });
        } catch (_e) {
            // portal_admins table may not exist yet; non-blocking
        }

        await logPortalAuditEvent('admin_auth_account_created', {
            email,
            created_by: state.session?.user?.email || null,
        });
        closeModal(true);
        await loadAdmins().catch(() => {});
        render();
        showToast('Usuário admin criado com sucesso.', 'success');
    } catch (error) {
        const message = error?.message
            ? String(error.message)
            : toUserFriendlyError(error, 'Não foi possível criar o usuário admin.');
        showToast(message, 'error');
    } finally {
        state.suppressAuthStateReactions = false;
        const elapsed = Date.now() - loadingStartedAt;
        const minimumLoadingMs = 450;
        if (elapsed < minimumLoadingMs) {
            await new Promise((resolve) => window.setTimeout(resolve, minimumLoadingMs - elapsed));
        }
        setPending('auth', false);
        setButtonLoading('admin-create-save-btn', false);
    }
}

async function completePasswordRecovery() {
    if (isPending('auth')) {
        return;
    }

    const password = document.getElementById('recovery-password')?.value || '';
    const passwordConfirm = document.getElementById('recovery-password-confirm')?.value || '';
    if (password.length < 8) {
        showToast('A senha precisa ter no mínimo 8 caracteres.', 'error');
        return;
    }
    if (password !== passwordConfirm) {
        showToast('A confirmação da senha não confere.', 'error');
        return;
    }

    setPending('auth', true);
    setButtonLoading('recovery-save-btn', true, 'Salvando...');
    try {
        ensureClient();
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) {
            throw error;
        }

        await logPortalAuditEvent('password_recovery_completed', {
            user_id: state.session?.user?.id || null,
        });
        if (window.location.hash === '#recovery') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        closeModal(true);
        showToast('Senha redefinida com sucesso.', 'success');
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível redefinir a senha.'), 'error');
    } finally {
        setPending('auth', false);
        setButtonLoading('recovery-save-btn', false);
    }
}

async function changeOwnPassword() {
    if (!isAdminSession()) {
        showToast('Faça login como admin para alterar a senha.', 'error');
        return;
    }

    if (isPending('auth')) {
        return;
    }

    const password = document.getElementById('change-password')?.value || '';
    const passwordConfirm = document.getElementById('change-password-confirm')?.value || '';
    if (password.length < 8) {
        showToast('A senha precisa ter no mínimo 8 caracteres.', 'error');
        return;
    }
    if (password !== passwordConfirm) {
        showToast('A confirmação da senha não confere.', 'error');
        return;
    }

    setPending('auth', true);
    setButtonLoading('change-password-save-btn', true, 'Salvando...');
    try {
        ensureClient();
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) {
            throw error;
        }

        await logPortalAuditEvent('admin_changed_own_password', {
            user_id: state.session?.user?.id || null,
            email: state.session?.user?.email || null,
        });
        closeModal(true);
        showToast('Senha alterada com sucesso.', 'success');
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível alterar a senha.'), 'error');
    } finally {
        setPending('auth', false);
        setButtonLoading('change-password-save-btn', false);
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
