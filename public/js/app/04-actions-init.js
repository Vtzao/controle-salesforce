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

    state.activeTab = tabId;
    render();
}

function renderSmooth() {
    state.skipNextViewAnimation = true;
    render();
}

function handleSearch(value) {
    state.searchQuery = value;
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

    if (!window.confirm(`Excluir a categoria "${category.name}"? Esta ação removerá seus módulos e vínculos.`)) {
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

    const externalInput = document.getElementById('user-external-id')?.value.trim() || '';
    const externalId = externalInput || existingUser?.externalId || createExternalId(fullName);
    const categoryIds = [...new Set(state.tempAssignedCategoryIds)];
    const duplicateExternalId = state.users.find((user) =>
        user.id !== existingUser?.id
        && user.externalId.trim().toLowerCase() === externalId.trim().toLowerCase()
    );

    if (duplicateExternalId) {
        showToast('Esse ID externo já está em uso.', 'error');
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
        };

        if (state.rpcAvailability.saveCollaboratorWithCategories !== false) {
            const { error } = await supabaseClient.rpc('save_collaborator_with_categories', {
                p_collaborator_id: existingUser?.id || null,
                p_external_id: basePayload.external_id,
                p_name: basePayload.name,
                p_role: basePayload.role,
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

    const shouldProceed = window.confirm(`Padronizar ${updates.length} cargo(s)? Essa ação atualizará os colaboradores no banco.`);
    if (!shouldProceed) {
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
    const header = ['Nome', 'Sobrenome', 'Cargo', ...state.categories.map((category) => category.name)];
    const sample = ['Ana', 'Silva', 'Analista', ...state.categories.map((_category, index) => (index < 2 ? '1' : ''))];
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
        const validBaseHeader = normalizedHeader[0] === 'nome'
            && normalizedHeader[1] === 'sobrenome'
            && normalizedHeader[2] === 'cargo';

        if (!validBaseHeader) {
            showToast('Cabeçalho inválido. Use: Nome, Sobrenome, Cargo + categorias.', 'error');
            return;
        }

        const csvCategoryColumns = header
            .slice(3)
            .map((name, index) => ({ name: String(name || '').trim(), index: index + 3 }))
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
            const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

            if (!fullName || !role) {
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
            };

            try {
                if (state.rpcAvailability.saveCollaboratorWithCategories !== false) {
                    const { error } = await supabaseClient.rpc('save_collaborator_with_categories', {
                        p_collaborator_id: existingUser?.id || null,
                        p_external_id: basePayload.external_id,
                        p_name: basePayload.name,
                        p_role: basePayload.role,
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

    if (!window.confirm(`Excluir o usuário "${user.fullName}"?`)) {
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

async function toggleCompletion(userId, categoryId, moduleId) {
    if (!isAdminSession()) {
        return;
    }

    if (isPending('saveStatus') || isPending('loadData')) {
        return;
    }
    if (!state.statusSelectionMode) {
        return;
    }

    const user = state.users.find((item) => item.id === userId);
    const category = state.categories.find((item) => item.id === categoryId);
    const assigned = Boolean(user && user.categoryIds.includes(categoryId));
    const moduleExists = Boolean(category?.modules?.some((module) => module.id === moduleId));
    if (!user || !assigned || !moduleExists) {
        return;
    }

    const key = statusDraftKey(userId, categoryId, moduleId);
    if (state.selectedStatusCells[key]) {
        delete state.selectedStatusCells[key];
    } else {
        state.selectedStatusCells[key] = true;
    }

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

    const header = ['Nome', 'Cargo', 'ID Externo', ...categoriesWithModules.map(({ category, module }) => `${category.name} > ${module.name}`)];
    const rows = getFilteredUsers().map((user) => [
        user.fullName,
        user.role,
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
            closeModal();
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
        const initialLoadPromise = loadAppData({ showErrorToast: isAdminSession() });
        render();
        await initialLoadPromise;

        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            const previousSession = state.session;
            const previousUserId = previousSession?.user?.id || null;
            const hadSession = Boolean(previousSession);
            const hadAdminSession = Boolean(previousSession && !previousSession?.user?.is_anonymous);
            state.session = session;
            state.authReady = true;
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
window.setUserListSort = setUserListSort;
window.clearUserListFilters = clearUserListFilters;
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
window.toggleCompletion = toggleCompletion;
window.setStatusForSelectedCells = setStatusForSelectedCells;
window.selectAllVisibleStatusCells = selectAllVisibleStatusCells;
window.clearStatusSelection = clearStatusSelection;
window.toggleStatusSelectionMode = toggleStatusSelectionMode;
window.saveStatusChanges = saveStatusChanges;
window.cancelStatusChanges = cancelStatusChanges;
window.exportCsv = exportCsv;
window.login = login;
window.logout = logout;

window.addEventListener('load', initialize);


