function switchTab(tabId) {
    if (isPending('loadData') && !state.hasLoadedOnce) {
        return;
    }
    const adminTabs = new Set(['dashboard', 'categories', 'report', 'users', 'category-detail']);
    if (!isAdminSession() && adminTabs.has(tabId)) {
        openAdminLoginModal();
        return;
    }
    const leavingStatusEditor = (state.activeTab === 'report' || state.activeTab === 'category-detail')
        && tabId !== 'report'
        && tabId !== 'category-detail';
    if (leavingStatusEditor && (hasPendingStatusChanges() || hasSelectedStatusCells())) {
        const shouldLeave = window.confirm('Existem alterações pendentes ou seleções em andamento na matriz. Deseja sair sem salvar?');
        if (!shouldLeave) {
            return;
        }
        state.statusDraft = {};
        clearStatusSelection();
        state.statusSelectionMode = false;
    }

    if (tabId !== 'categories' && state.inlineModuleEditor.categoryId) {
        state.inlineModuleEditor = { categoryId: null, modules: [], editingIndex: null };
    }
    if (tabId !== 'users' && state.userBulkSelectionMode) {
        state.userBulkSelectionMode = false;
        state.selectedUserIds = {};
    }

    state.activeTab = tabId;
    render();
    if (typeof closeMobileMenu === 'function') {
        closeMobileMenu();
    }
}

function renderSmooth() {
    state.skipNextViewAnimation = true;
    render();
}

let _searchDebounceTimer = null;
function handleSearch(value) {
    state.searchQuery = value;
    if (_searchDebounceTimer) {
        window.clearTimeout(_searchDebounceTimer);
    }
    _searchDebounceTimer = window.setTimeout(() => {
        _searchDebounceTimer = null;
        renderSmooth();
    }, 200);
}

function setMobileMatrixPage(scrollKey, page) {
    state.mobileMatrixPages[scrollKey] = Math.max(0, page);
    renderSmooth();
}

function toggleCategoryModules(id) {
    if (isPending('loadData') && !state.hasLoadedOnce) {
        return;
    }
    if (state.expandedCategoryId === id) {
        state.expandedCategoryId = null;
        if (state.inlineModuleEditor.categoryId === id) {
            state.inlineModuleEditor = { categoryId: null, modules: [], editingIndex: null };
        }
    } else {
        state.expandedCategoryId = id;
        if (state.inlineModuleEditor.categoryId && state.inlineModuleEditor.categoryId !== id) {
            state.inlineModuleEditor = { categoryId: null, modules: [], editingIndex: null };
        }
    }
    render();
}

function viewCategory(id) {
    if (isPending('loadData') && !state.hasLoadedOnce) {
        return;
    }
    state.selectedCategoryId = id;
    state.activeTab = 'category-detail';
    render();
}

function startInlineModuleEdit(categoryId) {
    if (isPending('saveCategory') || isPending('loadData')) {
        return;
    }

    const category = state.categories.find((item) => item.id === categoryId);
    if (!category) {
        return;
    }

    state.inlineModuleEditor = {
        categoryId,
        modules: category.modules.map((module) => ({
            id: module.id,
            name: module.name,
            sort_order: module.sort_order,
        })),
        editingIndex: null,
    };
    render();
}

function cancelInlineModuleEdit() {
    state.inlineModuleEditor = { categoryId: null, modules: [], editingIndex: null };
    render();
}

function addInlineModuleDraft() {
    if (state.inlineModuleEditor.categoryId === null) {
        return;
    }

    const newIndex = state.inlineModuleEditor.modules.length;
    state.inlineModuleEditor.modules.push({
        id: null,
        name: '',
        sort_order: newIndex + 1,
    });
    state.inlineModuleEditor.editingIndex = newIndex;
    render();
    focusInlineModuleField(newIndex);
}

function updateInlineModuleDraft(index, value) {
    const module = state.inlineModuleEditor.modules[index];
    if (!module) {
        return;
    }

    module.name = value;
}

function focusInlineModuleField(index) {
    const input = document.getElementById(`inline-module-input-${index}`);
    if (!input) {
        return;
    }

    window.requestAnimationFrame(() => {
        input.focus();
        input.select();
    });
}

function beginInlineModuleFieldEdit(index) {
    if (state.inlineModuleEditor.categoryId === null) {
        return;
    }

    const module = state.inlineModuleEditor.modules[index];
    if (!module) {
        return;
    }

    state.inlineModuleEditor.editingIndex = index;
    render();
    focusInlineModuleField(index);
}

function finishInlineModuleFieldEdit(index) {
    const module = state.inlineModuleEditor.modules[index];
    if (!module) {
        return;
    }

    module.name = String(module.name || '').trim();
    state.inlineModuleEditor.editingIndex = null;
    render();
}

function handleInlineModuleInputKeydown(event, index) {
    if (event.key === 'Enter') {
        event.preventDefault();
        finishInlineModuleFieldEdit(index);
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        state.inlineModuleEditor.editingIndex = null;
        render();
    }
}

function confirmInlineModuleDeletion(index) {
    const module = state.inlineModuleEditor.modules[index];
    if (!module) {
        return;
    }

    const moduleName = String(module.name || '').trim();
    const typed = window.prompt(`Para excluir o módulo \"${moduleName}\", digite o nome exatamente igual.`);
    if (typed === null) {
        return;
    }

    if (typed.trim() !== moduleName) {
        showToast('Nome de confirmação não confere. Exclusão cancelada.', 'error');
        return;
    }

    state.inlineModuleEditor.modules.splice(index, 1);
    if (state.inlineModuleEditor.editingIndex === index) {
        state.inlineModuleEditor.editingIndex = null;
    } else if (state.inlineModuleEditor.editingIndex > index) {
        state.inlineModuleEditor.editingIndex -= 1;
    }
    render();
}

async function saveInlineModuleEdit(categoryId) {
    if (isPending('saveCategory')) {
        return;
    }

    const category = state.categories.find((item) => item.id === categoryId);
    if (!category || state.inlineModuleEditor.categoryId !== categoryId) {
        return;
    }

    const modulePayload = state.inlineModuleEditor.modules.map((module, index) => ({
        id: module.id || null,
        name: String(module.name || '').trim(),
        sort_order: index + 1,
    }));

    if (!modulePayload.length) {
        showToast('A categoria precisa ter pelo menos um módulo.', 'error');
        return;
    }

    if (modulePayload.some((module) => !module.name)) {
        showToast('Todos os módulos precisam ter nome.', 'error');
        return;
    }

    const uniqueNames = new Set(modulePayload.map((module) => module.name.toLowerCase()));
    if (uniqueNames.size !== modulePayload.length) {
        showToast('Os módulos da categoria devem ter nomes únicos.', 'error');
        return;
    }

    setPending('saveCategory', true);
    try {
        ensureClient();
        const rpcPayload = {
            p_category_id: category.id,
            p_name: category.name,
            p_modules: modulePayload.map((module) => ({
                id: module.id,
                name: module.name,
                sort_order: module.sort_order,
            })),
        };

        if (state.rpcAvailability.saveCategoryWithModules !== false) {
            const { error } = await supabaseClient.rpc('save_category_with_modules', rpcPayload);
            if (error) {
                if (isRpcMissing(error, 'save_category_with_modules')) {
                    state.rpcAvailability.saveCategoryWithModules = false;
                    await saveCategoryLegacy(category, category.name, modulePayload);
                } else {
                    throw error;
                }
            } else {
                state.rpcAvailability.saveCategoryWithModules = true;
            }
        } else {
            await saveCategoryLegacy(category, category.name, modulePayload);
        }

        state.inlineModuleEditor = { categoryId: null, modules: [], editingIndex: null };
        await loadAppData();
        state.expandedCategoryId = categoryId;
        render();
        showToast('Módulos da categoria atualizados.');
    } catch (error) {
        await loadAppData();
        showToast(toUserFriendlyError(error, 'Não foi possível atualizar os módulos da categoria.'), 'error');
    } finally {
        setPending('saveCategory', false);
    }
}

async function saveCategoryLegacy(existingCategory, categoryName, modulePayload) {
    let categoryId = existingCategory?.id;
    let createdCategoryId = null;

    if (existingCategory) {
        const { error } = await supabaseClient
            .from('categories')
            .update({ name: categoryName })
            .eq('id', existingCategory.id);

        if (error) {
            throw error;
        }

        const existingModuleIds = existingCategory.modules.map((module) => module.id);
        const keptModuleIds = modulePayload.filter((module) => module.id).map((module) => module.id);
        const deletedModuleIds = existingModuleIds.filter((id) => !keptModuleIds.includes(id));

        if (deletedModuleIds.length) {
            const { error } = await supabaseClient
                .from('modules')
                .delete()
                .in('id', deletedModuleIds);

            if (error) {
                throw error;
            }
        }
    } else {
        const { data, error } = await supabaseClient
            .from('categories')
            .insert({
                name: categoryName,
                sort_order: state.categories.length + 1,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        categoryId = data.id;
        createdCategoryId = data.id;
    }

    if (modulePayload.length) {
        const { error } = await supabaseClient
            .from('modules')
            .upsert(modulePayload.map((module) => ({
                id: module.id || null,
                category_id: categoryId,
                name: module.name,
                sort_order: module.sort_order,
            })));

        if (error) {
            throw error;
        }
    }

    return createdCategoryId;
}

async function syncUserCategories(userId, previousCategoryIds, nextCategoryIds) {
    const toInsert = nextCategoryIds.filter((categoryId) => !previousCategoryIds.includes(categoryId));
    const toDelete = previousCategoryIds.filter((categoryId) => !nextCategoryIds.includes(categoryId));

    if (toInsert.length) {
        const { error } = await supabaseClient
            .from('collaborator_categories')
            .insert(toInsert.map((categoryId) => ({
                collaborator_id: userId,
                category_id: categoryId,
            })));

        if (error) {
            throw error;
        }
    }

    if (toDelete.length) {
        const { error } = await supabaseClient
            .from('collaborator_categories')
            .delete()
            .eq('collaborator_id', userId)
            .in('category_id', toDelete);

        if (error) {
            throw error;
        }

        const moduleIdsToDelete = state.categories
            .filter((category) => toDelete.includes(category.id))
            .flatMap((category) => category.modules.map((module) => module.id));

        if (moduleIdsToDelete.length) {
            const { error } = await supabaseClient
                .from('collaborator_module_status')
                .delete()
                .eq('collaborator_id', userId)
                .in('module_id', moduleIdsToDelete);

            if (error) {
                throw error;
            }
        }
    }
}

async function saveUserLegacy(existingUser, basePayload, categoryIds) {
    let userId = existingUser?.id;

    if (existingUser) {
        const { error } = await supabaseClient
            .from('collaborators')
            .update(basePayload)
            .eq('id', existingUser.id);

        if (error) {
            throw error;
        }
    } else {
        const { data, error } = await supabaseClient
            .from('collaborators')
            .insert(basePayload)
            .select()
            .single();

        if (error) {
            throw error;
        }

        userId = data.id;
    }

    await syncUserCategories(userId, existingUser?.categoryIds || [], categoryIds);
}

async function saveCategory() {
    if (isPending('saveCategory')) {
        return;
    }

    const categoryName = document.getElementById('cat-name')?.value.trim();
    const existingCategory = state.categories.find((category) => category.id === state.currentEditingId);
    const normalizedCategoryName = categoryName?.toLowerCase();
    const duplicateCategory = state.categories.find((category) =>
        category.id !== existingCategory?.id
        && category.name.trim().toLowerCase() === normalizedCategoryName
    );
    const modulePayload = state.tempModules
        .map((module, index) => ({
            id: module.id || undefined,
            name: String(module.name || '').trim(),
            sort_order: index + 1,
        }))
        .filter((module) => module.name);

    if (!categoryName) {
        showToast('Informe o nome da categoria.', 'error');
        return;
    }

    if (!modulePayload.length) {
        showToast('Adicione pelo menos um módulo para a categoria.', 'error');
        return;
    }

    if (duplicateCategory) {
        showToast('Já existe uma categoria com esse nome.', 'error');
        return;
    }

    if (new Set(modulePayload.map((module) => module.name.toLowerCase())).size !== modulePayload.length) {
        showToast('Os módulos da categoria devem ter nomes únicos.', 'error');
        return;
    }

    let createdCategoryId = null;
    setPending('saveCategory', true);
    setButtonLoading('category-save-btn', true, 'Salvando...');
    try {
        ensureClient();
        const rpcPayload = {
            p_category_id: existingCategory?.id || null,
            p_name: categoryName,
            p_modules: modulePayload.map((module) => ({
                id: module.id || null,
                name: module.name,
                sort_order: module.sort_order,
            })),
        };

        if (state.rpcAvailability.saveCategoryWithModules !== false) {
            const { error } = await supabaseClient.rpc('save_category_with_modules', rpcPayload);
            if (error) {
                if (isRpcMissing(error, 'save_category_with_modules')) {
                    state.rpcAvailability.saveCategoryWithModules = false;
                    createdCategoryId = await saveCategoryLegacy(existingCategory, categoryName, modulePayload);
                } else {
                    throw error;
                }
            } else {
                state.rpcAvailability.saveCategoryWithModules = true;
            }
        } else {
            createdCategoryId = await saveCategoryLegacy(existingCategory, categoryName, modulePayload);
        }

        closeModal(true);
        await loadAppData();
        showToast(existingCategory ? 'Categoria atualizada.' : 'Categoria criada.');
    } catch (error) {
        if (!existingCategory && createdCategoryId) {
            await supabaseClient
                .from('categories')
                .delete()
                .eq('id', createdCategoryId);
        }
        await loadAppData();
        showToast(toUserFriendlyError(error, 'Não foi possível salvar a categoria.'), 'error');
    } finally {
        setPending('saveCategory', false);
        setButtonLoading('category-save-btn', false);
    }
}

async function deleteCategory(id) {
    if (isPending('deleteCategory')) {
        return;
    }

    const category = state.categories.find((item) => item.id === id);
    if (!category) {
        return;
    }

    const confirmed = await showConfirmDialog(
        `Excluir categoria "${category.name}"?`,
        'Esta ação removerá todos os módulos e vínculos de usuários desta categoria.'
    );
    if (!confirmed) {
        return;
    }

    setPending('deleteCategory', true);
    try {
        ensureClient();
        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        if (state.selectedCategoryId === id) {
            state.selectedCategoryId = null;
            state.activeTab = 'categories';
        }
        if (state.expandedCategoryId === id) {
            state.expandedCategoryId = null;
        }
        if (state.inlineModuleEditor.categoryId === id) {
            state.inlineModuleEditor = { categoryId: null, modules: [], editingIndex: null };
        }

        await loadAppData();
        showToast('Categoria excluída.');
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível excluir a categoria.'), 'error');
    } finally {
        setPending('deleteCategory', false);
    }
}

async function saveUser() {
    if (isPending('saveUser')) {
        return;
    }

    const firstName = document.getElementById('user-fname')?.value.trim() || '';
    const lastName = document.getElementById('user-lname')?.value.trim() || '';
    const roleInput = document.getElementById('user-role')?.value.trim() || '';
    const role = normalizeRoleLabel(roleInput);
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const existingUser = state.users.find((user) => user.id === state.currentEditingId);

    if (!fullName) {
        showToast('Informe o nome do usuário.', 'error');
        return;
    }

    if (!roleInput) {
        showToast('Informe o cargo do usuário.', 'error');
        return;
    }

    const email = (document.getElementById('user-email')?.value || '').trim().toLowerCase();
    if (!email) {
        showToast('Informe o e-mail do usuário.', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Informe um e-mail válido.', 'error');
        return;
    }

    const externalInput = document.getElementById('user-external-id')?.value.trim() || '';
    const externalId = externalInput || existingUser?.externalId || createExternalId(fullName);
    const categoryIds = [...new Set(state.tempAssignedCategoryIds)];
    const duplicateExternalId = state.users.find((user) =>
        user.id !== existingUser?.id
        && user.externalId.trim().toLowerCase() === externalId.trim().toLowerCase()
    );
    const duplicateEmail = state.users.find((user) =>
        user.id !== existingUser?.id
        && String(user.email || '').trim().toLowerCase() === email
    );

    if (duplicateExternalId) {
        showToast('Esse ID externo já está em uso.', 'error');
        return;
    }

    if (duplicateEmail) {
        showToast('Esse e-mail já está em uso.', 'error');
        return;
    }

    setPending('saveUser', true);
    setButtonLoading('user-save-btn', true, 'Salvando...');
    try {
        ensureClient();
        const basePayload = {
            external_id: externalId,
            name: fullName,
            role,
            email,
        };

        if (state.rpcAvailability.saveCollaboratorWithCategories !== false) {
            const { error } = await supabaseClient.rpc('save_collaborator_with_categories', {
                p_collaborator_id: existingUser?.id || null,
                p_external_id: basePayload.external_id,
                p_name: basePayload.name,
                p_role: basePayload.role,
                p_email: basePayload.email,
                p_category_ids: categoryIds,
            });

            if (error) {
                if (isRpcMissing(error, 'save_collaborator_with_categories')) {
                    state.rpcAvailability.saveCollaboratorWithCategories = false;
                    await saveUserLegacy(existingUser, basePayload, categoryIds);
                } else {
                    throw error;
                }
            } else {
                state.rpcAvailability.saveCollaboratorWithCategories = true;
            }
        } else {
            await saveUserLegacy(existingUser, basePayload, categoryIds);
        }

        closeModal(true);
        await loadAppData();
        showToast(existingUser ? 'Usuário atualizado.' : 'Usuário criado.');
    } catch (error) {
        await loadAppData();
        showToast(toUserFriendlyError(error, 'Não foi possível salvar o usuário.'), 'error');
    } finally {
        setPending('saveUser', false);
        setButtonLoading('user-save-btn', false);
    }
}

async function normalizeAllUserRoles() {
    if (isPending('normalizeRoles') || isPending('loadData') || isPending('saveUser') || isPending('importUsers')) {
        return;
    }

    const updates = state.users
        .map((user) => ({
            id: user.id,
            current: String(user.role || '').trim(),
            normalized: normalizeRoleLabel(user.role),
        }))
        .filter((item) => item.current && item.normalized && item.current !== item.normalized);

    if (!updates.length) {
        showToast('Os cargos já estão padronizados.', 'info');
        return;
    }

    const confirmed = await showConfirmDialog(
        `Padronizar ${updates.length} cargo(s)?`,
        'Os nomes dos cargos serão normalizados no banco de dados. Esta ação pode ser revertida manualmente.',
        { danger: false, confirmLabel: 'Padronizar' }
    );
    if (!confirmed) {
        return;
    }

    setPending('normalizeRoles', true);
    try {
        ensureClient();

        for (const item of updates) {
            const { error } = await supabaseClient
                .from('collaborators')
                .update({ role: item.normalized })
                .eq('id', item.id);

            if (error) {
                throw error;
            }
        }

        await loadAppData();
        showToast(`${updates.length} cargo(s) padronizado(s) com sucesso.`);
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível padronizar os cargos.'), 'error');
    } finally {
        setPending('normalizeRoles', false);
    }
}

function downloadUsersCsvTemplate() {
    const header = ['Nome', 'Sobrenome', 'Cargo', 'E-mail', ...state.categories.map((category) => category.name)];
    const sample = ['Ana', 'Silva', 'Analista', 'ana.silva@empresa.com', ...state.categories.map((_category, index) => (index < 2 ? '1' : ''))];
    const csv = [header, sample]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-importacao-colaboradores.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function triggerUserCsvImport() {
    if (isPending('loadData') || isPending('saveUser') || isPending('deleteUser') || isPending('importUsers')) {
        return;
    }

    const input = document.getElementById('user-import-input');
    if (!input) {
        return;
    }

    input.value = '';
    input.click();
}

async function handleUserCsvSelected(event) {
    const input = event?.target;
    const file = input?.files?.[0];
    if (!file) {
        return;
    }

    try {
        await importUsersFromCsvFile(file);
    } finally {
        input.value = '';
    }
}

function chooseCsvDelimiter(headerLine) {
    const candidates = [';', ',', '|', '\t'];
    let delimiter = ';';
    let bestScore = -1;

    for (const candidate of candidates) {
        const score = String(headerLine || '').split(candidate).length;
        if (score > bestScore) {
            bestScore = score;
            delimiter = candidate;
        }
    }

    return delimiter;
}

function parseCsvLine(line, delimiter) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

        if (char === '"') {
            if (inQuotes && line[index + 1] === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === delimiter && !inQuotes) {
            cells.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    cells.push(current.trim());
    return cells;
}

function parseCsvText(csvText) {
    const cleanText = String(csvText || '').replace(/^\uFEFF/, '');
    const lines = cleanText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (!lines.length) {
        return { delimiter: ';', rows: [] };
    }

    const delimiter = chooseCsvDelimiter(lines[0]);
    const rows = lines.map((line) => parseCsvLine(line, delimiter));
    return { delimiter, rows };
}

function isCsvAssignedCategory(value) {
    const normalized = normalizeComparisonKey(value);
    if (!normalized) {
        return false;
    }

    return ['1', 'x', 'sim', 's', 'true', 'yes', 'y', 'ok'].includes(normalized);
}

async function importUsersFromCsvFile(file) {
    if (isPending('importUsers') || isPending('loadData')) {
        return;
    }

    setPending('importUsers', true);
    try {
        ensureClient();
        const csvText = await file.text();
        const { rows } = parseCsvText(csvText);
        if (rows.length < 2) {
            showToast('CSV vazio ou sem linhas de dados.', 'error');
            return;
        }

        const header = rows[0].map((column) => String(column || '').trim());
        const normalizedHeader = header.map((column) => normalizeComparisonKey(column));
        const emailHeader = normalizedHeader[3];
        const validBaseHeader = normalizedHeader[0] === 'nome'
            && normalizedHeader[1] === 'sobrenome'
            && normalizedHeader[2] === 'cargo'
            && ['email', 'e-mail'].includes(emailHeader);

        if (!validBaseHeader) {
            showToast('Cabeçalho inválido. Use: Nome, Sobrenome, Cargo, E-mail + categorias.', 'error');
            return;
        }

        const csvCategoryColumns = header
            .slice(4)
            .map((name, index) => ({ name: String(name || '').trim(), index: index + 4 }))
            .filter((column) => column.name);

        if (!csvCategoryColumns.length) {
            showToast('Inclua pelo menos uma coluna de categoria no CSV.', 'error');
            return;
        }

        const categoriesByKey = new Map(
            state.categories.map((category) => [normalizeComparisonKey(category.name), category])
        );
        const mappedCategoryColumns = [];
        const missingCategories = [];

        for (const column of csvCategoryColumns) {
            const category = categoriesByKey.get(normalizeComparisonKey(column.name));
            if (!category) {
                missingCategories.push(column.name);
                continue;
            }

            mappedCategoryColumns.push({ ...column, categoryId: category.id });
        }

        if (missingCategories.length) {
            showToast(`Categorias não encontradas: ${missingCategories.join(', ')}`, 'error');
            return;
        }

        const usersByName = new Map(
            state.users.map((user) => [normalizeComparisonKey(user.fullName), user])
        );

        let created = 0;
        let updated = 0;
        let skipped = 0;
        let failed = 0;

        for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex];
            if (!row || !row.some((cell) => String(cell || '').trim())) {
                continue;
            }

            const firstName = String(row[0] || '').trim();
            const lastName = String(row[1] || '').trim();
            const role = normalizeRoleLabel(String(row[2] || '').trim());
            const email = String(row[3] || '').trim().toLowerCase();
            const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

            if (!fullName || !role || !email) {
                skipped += 1;
                continue;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                skipped += 1;
                continue;
            }

            const categoryIds = mappedCategoryColumns
                .filter((column) => isCsvAssignedCategory(row[column.index]))
                .map((column) => column.categoryId);
            const existingUser = usersByName.get(normalizeComparisonKey(fullName)) || null;
            const basePayload = {
                external_id: existingUser?.externalId || `${createExternalId(fullName)}-${rowIndex}`,
                name: fullName,
                role,
                email,
            };

            try {
                if (state.rpcAvailability.saveCollaboratorWithCategories !== false) {
                    const { error } = await supabaseClient.rpc('save_collaborator_with_categories', {
                        p_collaborator_id: existingUser?.id || null,
                        p_external_id: basePayload.external_id,
                        p_name: basePayload.name,
                        p_role: basePayload.role,
                        p_email: basePayload.email,
                        p_category_ids: categoryIds,
                    });

                    if (error) {
                        if (isRpcMissing(error, 'save_collaborator_with_categories')) {
                            state.rpcAvailability.saveCollaboratorWithCategories = false;
                            await saveUserLegacy(existingUser, basePayload, categoryIds);
                        } else {
                            throw error;
                        }
                    } else {
                        state.rpcAvailability.saveCollaboratorWithCategories = true;
                    }
                } else {
                    await saveUserLegacy(existingUser, basePayload, categoryIds);
                }

                if (existingUser) {
                    updated += 1;
                } else {
                    created += 1;
                    usersByName.set(normalizeComparisonKey(fullName), {
                        id: null,
                        fullName,
                        externalId: basePayload.external_id,
                        email: basePayload.email,
                    });
                }
            } catch (error) {
                failed += 1;
                console.error(`Falha ao importar linha ${rowIndex + 1}`, error);
            }
        }

        await loadAppData();
        showToast(
            `Importação concluída: ${created} criado(s), ${updated} atualizado(s), ${skipped} ignorado(s), ${failed} erro(s).`,
            failed ? 'error' : 'success'
        );
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível importar o CSV de colaboradores.'), 'error');
    } finally {
        setPending('importUsers', false);
    }
}

async function deleteUser(id) {
    if (isPending('deleteUser')) {
        return;
    }

    const user = state.users.find((item) => item.id === id);
    if (!user) {
        return;
    }

    const confirmed = await showConfirmDialog(
        `Excluir "${user.fullName}"?`,
        'Esta ação removerá o usuário e todos os seus dados de treinamento. Não pode ser desfeita.'
    );
    if (!confirmed) {
        return;
    }

    setPending('deleteUser', true);
    try {
        ensureClient();
        const { error } = await supabaseClient
            .from('collaborators')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        await loadAppData();
        showToast('Usuário excluído.');
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível excluir o usuário.'), 'error');
    } finally {
        setPending('deleteUser', false);
    }
}

async function toggleUserActive(id) {
    if (isPending('toggleUserActive') || isPending('loadData')) {
        return;
    }

    const user = state.users.find((item) => item.id === id);
    if (!user) {
        return;
    }

    const currentlyActive = isUserActive(user);
    const nextIsActive = !currentlyActive;
    const actionLabel = currentlyActive ? 'inativar' : 'ativar';
    const actionPastLabel = currentlyActive ? 'inativado' : 'ativado';
    const confirmation = await showConfirmDialog(
        `${currentlyActive ? 'Inativar' : 'Ativar'} "${user.fullName}"?`,
        currentlyActive
            ? 'O usuário ficará oculto nas visões públicas e do dashboard, mas poderá ser reativado depois.'
            : 'O usuário voltará a aparecer nas visões públicas e do dashboard.'
    );

    if (!confirmation) {
        return;
    }

    setPending('toggleUserActive', true);
    try {
        ensureClient();
        const { error } = await supabaseClient
            .from('collaborators')
            .update({ is_active: nextIsActive })
            .eq('id', id);

        if (error) {
            throw error;
        }

        await logPortalAuditEvent?.(nextIsActive ? 'user_reactivated' : 'user_deactivated', {
            user_id: id,
            user_name: user.fullName,
            user_email: user.email || null,
            user_email_like_id: user.externalId || null,
            changed_by: state.session?.user?.email || null,
        });

        await loadAppData();
        showToast(`Usuário ${actionPastLabel} com sucesso.`);
    } catch (error) {
        console.warn('[toggleUserActive] error:', error?.code, error?.message, error);
        showToast(toUserFriendlyError(error, `Não foi possível ${actionLabel} o usuário.`), 'error');
    } finally {
        setPending('toggleUserActive', false);
    }
}

function getUsersFromCurrentManagementPage() {
    const filteredUsers = getUsersForManagement();
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));
    const safePage = Math.min(state.userListPage || 0, totalPages - 1);
    return filteredUsers.slice(safePage * USER_PAGE_SIZE, (safePage + 1) * USER_PAGE_SIZE);
}

function toggleUserBulkSelectionMode() {
    if (isPending('loadData') || isPending('saveUser') || isPending('deleteUser') || isPending('bulkUserAction')) {
        return;
    }

    if (state.userBulkSelectionMode) {
        state.userBulkSelectionMode = false;
        state.selectedUserIds = {};
        render();
        return;
    }

    state.userBulkSelectionMode = true;
    state.selectedUserIds = {};
    render();
}

function toggleUserBulkSelection(userId) {
    if (!state.userBulkSelectionMode || isPending('bulkUserAction') || isPending('loadData')) {
        return;
    }

    const user = state.users.find((item) => item.id === userId);
    if (!user) {
        return;
    }

    if (isUserSelectedForBulk(userId)) {
        delete state.selectedUserIds[userId];
    } else {
        state.selectedUserIds[userId] = true;
    }
    renderSmooth();
}

function selectAllUsersOnCurrentPage() {
    if (!state.userBulkSelectionMode || isPending('bulkUserAction') || isPending('loadData')) {
        return;
    }

    const usersOnPage = getUsersFromCurrentManagementPage();
    if (!usersOnPage.length) {
        showToast('Nenhum usuário disponível nesta página.', 'info');
        return;
    }

    const nextSelected = { ...state.selectedUserIds };
    usersOnPage.forEach((user) => {
        nextSelected[user.id] = true;
    });
    state.selectedUserIds = nextSelected;
    renderSmooth();
}

function selectAllUsersFromCurrentFilter() {
    if (!state.userBulkSelectionMode || isPending('bulkUserAction') || isPending('loadData')) {
        return;
    }

    const filteredUsers = getUsersForManagement();
    if (!filteredUsers.length) {
        showToast('Nenhum usuário disponível nos filtros atuais.', 'info');
        return;
    }

    const nextSelected = { ...state.selectedUserIds };
    filteredUsers.forEach((user) => {
        nextSelected[user.id] = true;
    });
    state.selectedUserIds = nextSelected;
    renderSmooth();
}

function clearUserBulkSelection() {
    if (!state.userBulkSelectionMode || isPending('bulkUserAction')) {
        return;
    }
    state.selectedUserIds = {};
    renderSmooth();
}

async function inactivateSelectedUsers() {
    if (!state.userBulkSelectionMode || isPending('bulkUserAction') || isPending('loadData')) {
        return;
    }

    const draftStats = getUserCategoryDraftStats();
    if (draftStats.dirty > 0 || draftStats.saving > 0) {
        showToast('Salve ou cancele as alterações de categorias antes de executar ações em lote.', 'info');
        return;
    }

    const selectedUsers = getSelectedUsersForBulk();
    if (!selectedUsers.length) {
        showToast('Selecione ao menos um usuário.', 'info');
        return;
    }

    const activeUsers = selectedUsers.filter((user) => isUserActive(user));
    if (!activeUsers.length) {
        showToast('Os usuários selecionados já estão inativos.', 'info');
        return;
    }

    const confirmed = await showConfirmDialog(
        `Inativar ${formatCountLabel(activeUsers.length, 'usuário selecionado', 'usuários selecionados')}?`,
        'Eles ficarão ocultos nas visões públicas e do dashboard, mas poderão ser reativados depois.',
        { danger: false, confirmLabel: 'Inativar' }
    );
    if (!confirmed) {
        return;
    }

    setPending('bulkUserAction', true);
    try {
        ensureClient();
        const activeIds = activeUsers.map((user) => user.id);
        const { error } = await supabaseClient
            .from('collaborators')
            .update({ is_active: false })
            .in('id', activeIds);

        if (error) {
            throw error;
        }

        await logPortalAuditEvent?.('users_bulk_deactivated', {
            user_ids: activeIds,
            changed_by: state.session?.user?.email || null,
        });

        state.selectedUserIds = {};
        await loadAppData();
        showToast(`${formatCountLabel(activeUsers.length, 'usuário inativado', 'usuários inativados')} com sucesso.`);
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível inativar os usuários selecionados.'), 'error');
    } finally {
        setPending('bulkUserAction', false);
    }
}

async function deleteSelectedUsers() {
    if (!state.userBulkSelectionMode || isPending('bulkUserAction') || isPending('loadData')) {
        return;
    }

    const draftStats = getUserCategoryDraftStats();
    if (draftStats.dirty > 0 || draftStats.saving > 0) {
        showToast('Salve ou cancele as alterações de categorias antes de executar ações em lote.', 'info');
        return;
    }

    const selectedUsers = getSelectedUsersForBulk();
    if (!selectedUsers.length) {
        showToast('Selecione ao menos um usuário.', 'info');
        return;
    }

    const confirmed = await showConfirmDialog(
        `Excluir ${formatCountLabel(selectedUsers.length, 'usuário selecionado', 'usuários selecionados')}?`,
        'Esta ação removerá os usuários selecionados e todos os seus dados de treinamento. Não pode ser desfeita.',
        { danger: true, confirmLabel: 'Excluir' }
    );
    if (!confirmed) {
        return;
    }

    setPending('bulkUserAction', true);
    try {
        ensureClient();
        const selectedIds = selectedUsers.map((user) => user.id);
        const { error } = await supabaseClient
            .from('collaborators')
            .delete()
            .in('id', selectedIds);

        if (error) {
            throw error;
        }

        await logPortalAuditEvent?.('users_bulk_deleted', {
            user_ids: selectedIds,
            changed_by: state.session?.user?.email || null,
        });

        state.selectedUserIds = {};
        await loadAppData();
        showToast(`${formatCountLabel(selectedUsers.length, 'usuário excluído', 'usuários excluídos')} com sucesso.`);
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível excluir os usuários selecionados.'), 'error');
    } finally {
        setPending('bulkUserAction', false);
    }
}

let statusSelectionDragListenersAttached = false;

function canInteractWithStatusSelection() {
    if (!isAdminSession()) {
        return false;
    }

    if (isPending('saveStatus') || isPending('loadData')) {
        return false;
    }

    if (!state.statusSelectionMode) {
        return false;
    }

    return true;
}

function isSelectableStatusCell(userId, categoryId, moduleId) {
    const user = state.users.find((item) => item.id === userId);
    const category = state.categories.find((item) => item.id === categoryId);
    const assigned = Boolean(user && user.categoryIds.includes(categoryId));
    const moduleExists = Boolean(category?.modules?.some((module) => module.id === moduleId));
    return Boolean(user && assigned && moduleExists);
}

function syncStatusCellButtonVisual(button, selected) {
    if (!button) {
        return;
    }

    button.classList.toggle('ring-2', selected);
    button.classList.toggle('ring-blue-500', selected);
    button.classList.toggle('bg-blue-50', selected);
    button.classList.toggle('shadow-sm', selected);
    button.classList.toggle('hover:bg-slate-100', !selected && state.statusSelectionMode);
}

function applyStatusCellSelection(userId, categoryId, moduleId, shouldSelect, button) {
    if (!isSelectableStatusCell(userId, categoryId, moduleId)) {
        return false;
    }

    const key = statusDraftKey(userId, categoryId, moduleId);
    const wasSelected = Boolean(state.selectedStatusCells[key]);
    const nextSelected = Boolean(shouldSelect);

    if (nextSelected) {
        state.selectedStatusCells[key] = true;
    } else {
        delete state.selectedStatusCells[key];
    }

    if (button) {
        syncStatusCellButtonVisual(button, nextSelected);
    }

    return wasSelected !== nextSelected;
}

function extractStatusCellDataFromButton(button) {
    if (!button || button.disabled) {
        return null;
    }

    const userId = button.getAttribute('data-status-user-id');
    const categoryId = button.getAttribute('data-status-category-id');
    const moduleId = button.getAttribute('data-status-module-id');
    if (!userId || !categoryId || !moduleId) {
        return null;
    }

    return { button, userId, categoryId, moduleId };
}

function getStatusCellDataFromPointerTarget(target) {
    if (!target?.closest) {
        return null;
    }

    const button = target.closest('.status-selectable-cell-button');
    return extractStatusCellDataFromButton(button);
}

function getStatusCellDataFromPoint(clientX, clientY) {
    const target = document.elementFromPoint(clientX, clientY);
    return getStatusCellDataFromPointerTarget(target);
}

function attachStatusSelectionDragListeners() {
    if (statusSelectionDragListenersAttached) {
        return;
    }

    document.addEventListener('pointermove', handleStatusSelectionDragMove, { passive: false });
    document.addEventListener('pointerup', endStatusSelectionDrag);
    document.addEventListener('pointercancel', endStatusSelectionDrag);
    statusSelectionDragListenersAttached = true;
}

function detachStatusSelectionDragListeners() {
    if (!statusSelectionDragListenersAttached) {
        return;
    }

    document.removeEventListener('pointermove', handleStatusSelectionDragMove);
    document.removeEventListener('pointerup', endStatusSelectionDrag);
    document.removeEventListener('pointercancel', endStatusSelectionDrag);
    statusSelectionDragListenersAttached = false;
}

function startStatusSelectionDrag(event, userId, categoryId, moduleId) {
    if (!canInteractWithStatusSelection()) {
        return;
    }

    if (event.button !== undefined && event.button !== 0) {
        return;
    }

    const sourceCell = extractStatusCellDataFromButton(event.currentTarget);
    if (!sourceCell || !isSelectableStatusCell(userId, categoryId, moduleId)) {
        return;
    }

    event.preventDefault();

    const key = statusDraftKey(userId, categoryId, moduleId);
    const currentlySelected = Boolean(state.selectedStatusCells[key]);
    const dragState = state.statusSelectionDrag;
    dragState.active = true;
    dragState.shouldSelect = !currentlySelected;
    dragState.lastKey = key;
    dragState.moved = false;
    dragState.suppressClick = true;

    if (event.currentTarget?.setPointerCapture && event.pointerId !== undefined) {
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch (_error) {
            // Alguns navegadores podem falhar em setPointerCapture; o fluxo segue com listeners no document.
        }
    }

    applyStatusCellSelection(userId, categoryId, moduleId, dragState.shouldSelect, sourceCell.button);
    attachStatusSelectionDragListeners();
}

function handleStatusSelectionDragMove(event) {
    const dragState = state.statusSelectionDrag;
    if (!dragState.active || !canInteractWithStatusSelection()) {
        return;
    }

    if (event.cancelable) {
        event.preventDefault();
    }

    const targetCell = getStatusCellDataFromPoint(event.clientX, event.clientY);
    if (!targetCell || !isSelectableStatusCell(targetCell.userId, targetCell.categoryId, targetCell.moduleId)) {
        return;
    }

    const key = statusDraftKey(targetCell.userId, targetCell.categoryId, targetCell.moduleId);
    if (key === dragState.lastKey) {
        return;
    }

    dragState.lastKey = key;
    dragState.moved = true;
    applyStatusCellSelection(
        targetCell.userId,
        targetCell.categoryId,
        targetCell.moduleId,
        dragState.shouldSelect,
        targetCell.button
    );
}

function endStatusSelectionDrag() {
    const dragState = state.statusSelectionDrag;
    if (!dragState.active) {
        return;
    }

    dragState.active = false;
    dragState.lastKey = '';
    dragState.moved = false;
    detachStatusSelectionDragListeners();
    render();

    window.setTimeout(() => {
        state.statusSelectionDrag.suppressClick = false;
    }, 0);
}

async function toggleCompletion(userId, categoryId, moduleId) {
    if (state.statusSelectionDrag.suppressClick) {
        state.statusSelectionDrag.suppressClick = false;
        if (state.statusSelectionDrag.active) {
            endStatusSelectionDrag();
        }
        return;
    }

    if (!canInteractWithStatusSelection()) {
        return;
    }

    if (!isSelectableStatusCell(userId, categoryId, moduleId)) {
        return;
    }

    const key = statusDraftKey(userId, categoryId, moduleId);
    const shouldSelect = !Boolean(state.selectedStatusCells[key]);
    applyStatusCellSelection(userId, categoryId, moduleId, shouldSelect);
    render();
}

async function saveStatusChanges() {
    if (!isAdminSession()) {
        return;
    }

    if (isPending('saveStatus')) {
        return;
    }

    const entries = Object.entries(state.statusDraft);
    if (!entries.length) {
        return;
    }

    setPending('saveStatus', true);
    setButtonLoading('status-save-btn', true, 'Salvando...');
    try {
        ensureClient();
        const rows = entries.map(([key, status]) => {
            const [collaborator_id, _categoryId, module_id] = key.split('::');
            return {
                collaborator_id,
                module_id,
                status: normalizeModuleStatus(status),
            };
        });

        const { error } = await supabaseClient
            .from('collaborator_module_status')
            .upsert(rows, { onConflict: 'collaborator_id,module_id' });

        if (error) {
            throw error;
        }

        state.savedFlashKeys = new Set(entries.map(([key]) => key));
        state.statusDraft = {};
        clearStatusSelection();
        state.statusSelectionMode = false;
        clearStatusSelectionHelp();
        await loadAppData();
        showToast('Alterações da matriz salvas com sucesso.');
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível salvar as alterações da matriz.'), 'error');
    } finally {
        setPending('saveStatus', false);
        setButtonLoading('status-save-btn', false);
    }
}

function exportCsv() {
    const categoriesWithModules = state.categories.flatMap((category) =>
        category.modules.map((module) => ({ category, module }))
    );

    if (!categoriesWithModules.length) {
        showToast('Cadastre módulos antes de exportar o CSV.', 'info');
        return;
    }

    const header = ['Nome', 'Cargo', 'E-mail', 'ID Externo', ...categoriesWithModules.map(({ category, module }) => `${category.name} > ${module.name}`)];
    const rows = getFilteredUsers().map((user) => [
        user.fullName,
        user.role,
        user.email || '',
        user.externalId,
        ...categoriesWithModules.map(({ category, module }) => {
            const assigned = user.categoryIds.includes(category.id);
            if (!assigned) {
                return getModuleStatusLabel(MODULE_STATUS.NOT_PARTICIPATING);
            }
            const status = getModuleStatus(user, category.id, module.id);
            return getModuleStatusLabel(status);
        }),
    ]);

    const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matriz-treinamentos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function editCategory(id) {
    openModal('category', id);
}

function editUser(id) {
    openModal('user', id);
}

let _confirmDialogResolve = null;

function showConfirmDialog(title, message, opts = {}) {
    return new Promise((resolve) => {
        _confirmDialogResolve = resolve;
        const dialog = document.getElementById('confirm-dialog');
        const titleEl = document.getElementById('confirm-dialog-title');
        const msgEl = document.getElementById('confirm-dialog-message');
        const okBtn = document.getElementById('confirm-dialog-ok');
        const iconEl = document.getElementById('confirm-dialog-icon');

        titleEl.textContent = title;
        msgEl.textContent = message;
        okBtn.textContent = opts.confirmLabel || 'Confirmar';

        const danger = opts.danger !== false;
        okBtn.className = `flex-1 py-2.5 font-bold rounded-xl text-sm transition-colors ${danger ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-amber-500 text-white hover:bg-amber-600'}`;
        iconEl.className = `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`;

        dialog.classList.remove('hidden');
        lucide.createIcons();
    });
}

function resolveConfirmDialog() {
    document.getElementById('confirm-dialog').classList.add('hidden');
    if (_confirmDialogResolve) {
        _confirmDialogResolve(true);
        _confirmDialogResolve = null;
    }
}

function dismissConfirmDialog() {
    document.getElementById('confirm-dialog').classList.add('hidden');
    if (_confirmDialogResolve) {
        _confirmDialogResolve(false);
        _confirmDialogResolve = null;
    }
}

function setUserListPage(page) {
    state.userListPage = Math.max(0, page);
    renderSmooth();
}

async function loadAdmins() {
    if (!isAdminSession()) {
        return;
    }
    try {
        ensureClient();
        const { data, error } = await supabaseClient
            .from('portal_admins')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            const msg = String(error.message || '').toLowerCase();
            const isTableMissing =
                error.code === '42P01' ||
                error.code === 'PGRST200' ||
                error.code === 'PGRST205' ||
                msg.includes('does not exist') ||
                msg.includes('could not find the table') ||
                msg.includes('schema cache') ||
                msg.includes('relation') ||
                msg.includes('not found');
            if (isTableMissing) {
                state.admins = [];
                state.adminListError = 'tabela_nao_existe';
            } else {
                throw error;
            }
        } else {
            state.admins = data || [];
            state.adminListError = '';
        }
    } catch (error) {
        console.warn('[loadAdmins] error:', error?.code, error?.message, error);
        state.admins = [];
        state.adminListError = toUserFriendlyError(error, 'Não foi possível carregar os admins.');
    }
}

async function deleteAdminRecord(id) {
    if (isPending('deleteAdmin')) {
        return;
    }

    const admin = state.admins.find((item) => item.id === id);
    if (!admin) {
        return;
    }

    const isSelf = admin.email === state.session?.user?.email;
    if (isSelf) {
        showToast('Você não pode remover sua própria conta de admin.', 'error');
        return;
    }

    const confirmed = await showConfirmDialog(
        `Remover acesso de "${admin.email}"?`,
        'O registro de admin será removido. A conta de autenticação no Supabase não é excluída — desative-a pelo Supabase Dashboard se necessário.'
    );
    if (!confirmed) {
        return;
    }

    setPending('deleteAdmin', true);
    try {
        ensureClient();
        const { error } = await supabaseClient
            .from('portal_admins')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        state.admins = state.admins.filter((item) => item.id !== id);
        render();
        showToast('Admin removido do registro.');
    } catch (error) {
        showToast(toUserFriendlyError(error, 'Não foi possível remover o admin.'), 'error');
    } finally {
        setPending('deleteAdmin', false);
    }
}

async function updateAdminRecord(id) {
    if (isPending('updateAdmin')) {
        return;
    }

    if (!isAdminSession()) {
        showToast('Apenas administradores podem editar admins.', 'error');
        return;
    }

    const admin = state.admins.find((item) => item.id === id);
    if (!admin) {
        showToast('Admin não encontrado.', 'error');
        return;
    }

    if (admin.email === state.session?.user?.email) {
        showToast('Você não pode editar seu próprio registro aqui.', 'info');
        return;
    }

    const nextEmail = (document.getElementById('admin-edit-email')?.value || '').trim().toLowerCase();
    if (!nextEmail) {
        showToast('Informe o e-mail do admin.', 'error');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        showToast('Informe um e-mail válido.', 'error');
        return;
    }

    if (nextEmail === String(admin.email || '').trim().toLowerCase()) {
        closeModal(true);
        return;
    }

    setPending('updateAdmin', true);
    setButtonLoading('admin-edit-save-btn', true, 'Salvando...');
    try {
        ensureClient();
        const { data, error } = await supabaseClient
            .from('portal_admins')
            .update({ email: nextEmail })
            .eq('id', id)
            .select('*');

        if (error) {
            throw error;
        }

        const updatedAdmin = Array.isArray(data) ? data[0] : null;
        if (!updatedAdmin) {
            await loadAdmins();
            const refreshed = state.admins.find((item) => item.id === id);
            if (!refreshed) {
                throw new Error('Admin não encontrado para atualização.');
            }
            if (String(refreshed.email || '').trim().toLowerCase() !== nextEmail) {
                throw new Error('Sem permissão para atualizar esse admin no banco.');
            }
        } else {
            state.admins = state.admins.map((item) => (item.id === id ? updatedAdmin : item));
        }

        await logPortalAuditEvent?.('admin_email_updated', {
            admin_id: id,
            updated_by: state.session?.user?.email || null,
            previous_email: String(admin.email || '').trim().toLowerCase(),
            next_email: nextEmail,
        });
        closeModal(true);
        render();
        showToast('Admin atualizado com sucesso.');
    } catch (error) {
        console.warn('[updateAdminRecord] error:', error?.code, error?.message, error);
        const isDuplicate = String(error?.code || '') === '23505';
        if (isDuplicate) {
            showToast('Já existe um admin com esse e-mail.', 'error');
        } else {
            showToast(toUserFriendlyError(error, 'Não foi possível atualizar o admin.'), 'error');
        }
    } finally {
        setPending('updateAdmin', false);
        setButtonLoading('admin-edit-save-btn', false);
    }
}

function setupModalInteractions() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
        return;
    }

    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const confirmOpen = !document.getElementById('confirm-dialog')?.classList.contains('hidden');
            if (confirmOpen) {
                dismissConfirmDialog();
                return;
            }
            closeModal();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.getElementById('global-search');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}

async function ensurePublicSession() {
    if (state.session) {
        return state.session;
    }

    try {
        ensureClient();
        const { data, error } = await supabaseClient.auth.signInAnonymously();
        if (error) {
            throw error;
        }
        state.session = data?.session || null;
        return state.session;
    } catch (error) {
        state.publicDataError = 'Não foi possível carregar a sessão pública. Ative login anônimo no Supabase ou libere SELECT para anon.';
        return null;
    }
}

async function initialize() {
    try {
        setupModalInteractions();
        ensureClient();
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
            throw error;
        }

        state.session = data.session;
        if (!state.session) {
            await ensurePublicSession();
        }
        state.authReady = true;
        state.activeTab = isAdminSession() ? 'dashboard' : 'public-overview';

        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (state.suppressAuthStateReactions) {
                return;
            }

            const previousSession = state.session;
            const previousUserId = previousSession?.user?.id || null;
            const hadSession = Boolean(previousSession);
            const hadAdminSession = Boolean(previousSession && !previousSession?.user?.is_anonymous);
            state.session = session;
            state.authReady = true;
            if (event === 'PASSWORD_RECOVERY') {
                window.setTimeout(() => {
                    openModal('password-recovery');
                }, 0);
            }
            if (isAdminSession() && !hadAdminSession && state.activeTab === 'public-overview') {
                state.activeTab = 'dashboard';
            }
            render();

            const currentUserId = session?.user?.id || null;
            const shouldRefreshData = (!hadSession && Boolean(currentUserId))
                || (previousUserId && currentUserId && previousUserId !== currentUserId)
                || event === 'USER_UPDATED'
                || !state.hasLoadedOnce;

            if (session && shouldRefreshData) {
                await loadAppData({ showErrorToast: isAdminSession() });
            } else if (!session) {
                state.categories = [];
                state.users = [];
                state.publicDataError = '';
                state.userCategoryDrafts = {};
                state.statusDraft = {};
                clearStatusSelection();
                state.selectedCategoryId = null;
                state.expandedCategoryId = null;
                state.inlineModuleEditor = { categoryId: null, modules: [], editingIndex: null };
                state.userBulkSelectionMode = false;
                state.selectedUserIds = {};
                state.searchQuery = '';
                state.hasLoadedOnce = false;
                state.activeTab = 'public-overview';
                closeModal();
                render();
                const publicSession = await ensurePublicSession();
                if (publicSession) {
                    await loadAppData({ showErrorToast: false });
                } else {
                    state.hasLoadedOnce = true;
                    render();
                }
            }
        });

        const initialLoadPromise = loadAppData({ showErrorToast: isAdminSession() });
        render();
        if (window.location.hash === '#recovery') {
            window.setTimeout(() => {
                openModal('password-recovery');
            }, 0);
        }
        await initialLoadPromise;
    } catch (error) {
        state.bootError = toUserFriendlyError(error, 'Falha ao inicializar o Supabase.');
        state.publicDataError = state.bootError;
        state.authReady = true;
        render();
    }
}

window.switchTab = switchTab;
window.handleSearch = handleSearch;
window.setMatrixRoleFilter = setMatrixRoleFilter;
window.toggleMatrixFilterPanel = toggleMatrixFilterPanel;
window.selectAllMatrixCategories = selectAllMatrixCategories;
window.toggleMatrixCategory = toggleMatrixCategory;
window.selectAllMatrixCategoryModules = selectAllMatrixCategoryModules;
window.toggleMatrixModule = toggleMatrixModule;
window.clearMatrixFilters = clearMatrixFilters;
window.setPublicRoleFilter = setPublicRoleFilter;
window.setPublicCategoryFilter = setPublicCategoryFilter;
window.setPublicStatusFilter = setPublicStatusFilter;
window.setPublicSort = setPublicSort;
window.clearPublicFilters = clearPublicFilters;
window.togglePublicUserModules = togglePublicUserModules;
window.openAdminLoginModal = openAdminLoginModal;
window.toggleCategoryModules = toggleCategoryModules;
window.viewCategory = viewCategory;
window.startInlineModuleEdit = startInlineModuleEdit;
window.cancelInlineModuleEdit = cancelInlineModuleEdit;
window.addInlineModuleDraft = addInlineModuleDraft;
window.updateInlineModuleDraft = updateInlineModuleDraft;
window.beginInlineModuleFieldEdit = beginInlineModuleFieldEdit;
window.finishInlineModuleFieldEdit = finishInlineModuleFieldEdit;
window.handleInlineModuleInputKeydown = handleInlineModuleInputKeydown;
window.confirmInlineModuleDeletion = confirmInlineModuleDeletion;
window.saveInlineModuleEdit = saveInlineModuleEdit;
window.openModal = openModal;
window.closeModal = closeModal;
window.addModuleField = addModuleField;
window.updateTempModule = updateTempModule;
window.removeModuleFromList = removeModuleFromList;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.toggleUserCat = toggleUserCat;
window.setUserListCategoryFilter = setUserListCategoryFilter;
window.setUserListRoleFilter = setUserListRoleFilter;
window.setUserListActiveFilter = setUserListActiveFilter;
window.setUserListSort = setUserListSort;
window.clearUserListFilters = clearUserListFilters;
window.toggleUserBulkSelectionMode = toggleUserBulkSelectionMode;
window.toggleUserBulkSelection = toggleUserBulkSelection;
window.selectAllUsersFromCurrentFilter = selectAllUsersFromCurrentFilter;
window.selectAllUsersOnCurrentPage = selectAllUsersOnCurrentPage;
window.clearUserBulkSelection = clearUserBulkSelection;
window.inactivateSelectedUsers = inactivateSelectedUsers;
window.deleteSelectedUsers = deleteSelectedUsers;
window.toggleUserCategoryQuick = toggleUserCategoryQuick;
window.saveUserCategoryQuickChanges = saveUserCategoryQuickChanges;
window.cancelUserCategoryQuickChanges = cancelUserCategoryQuickChanges;
window.saveUser = saveUser;
window.normalizeAllUserRoles = normalizeAllUserRoles;
window.downloadUsersCsvTemplate = downloadUsersCsvTemplate;
window.triggerUserCsvImport = triggerUserCsvImport;
window.handleUserCsvSelected = handleUserCsvSelected;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.toggleUserActive = toggleUserActive;
window.startStatusSelectionDrag = startStatusSelectionDrag;
window.toggleCompletion = toggleCompletion;
window.setStatusForSelectedCells = setStatusForSelectedCells;
window.selectAllVisibleStatusCells = selectAllVisibleStatusCells;
window.clearStatusSelection = clearStatusSelection;
window.toggleStatusSelectionMode = toggleStatusSelectionMode;
window.saveStatusChanges = saveStatusChanges;
window.cancelStatusChanges = cancelStatusChanges;
window.exportCsv = exportCsv;
window.login = login;
window.togglePasswordVisibility = togglePasswordVisibility;
window.requestPasswordReset = requestPasswordReset;
window.createAdminUserAccount = createAdminUserAccount;
window.completePasswordRecovery = completePasswordRecovery;
window.changeOwnPassword = changeOwnPassword;
window.logout = logout;
window.showConfirmDialog = showConfirmDialog;
window.resolveConfirmDialog = resolveConfirmDialog;
window.dismissConfirmDialog = dismissConfirmDialog;
window.setUserListPage = setUserListPage;
window.loadAdmins = loadAdmins;
window.deleteAdminRecord = deleteAdminRecord;
window.updateAdminRecord = updateAdminRecord;

window.addEventListener('load', initialize);
