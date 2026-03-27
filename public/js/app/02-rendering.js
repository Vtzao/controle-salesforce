function getMatrixSectionMarkup(title, description, options = {}) {
    const filteredUsers = Array.isArray(options.filteredUsers) ? options.filteredUsers : getFilteredUsers();
    const matrixCategories = Array.isArray(options.matrixCategories) ? options.matrixCategories : state.categories;
    const hasModules = matrixCategories.some((category) => category.modules.length);
    const readOnly = Boolean(options.readOnly);
    const showExportButton = options.showExportButton !== false;
    const scrollKey = options.scrollKey || 'report-matrix';
    const statusBlocked = isPending('saveStatus') || isPending('loadData');
    const hasDraft = !readOnly && hasPendingStatusChanges();
    const draftCount = hasDraft ? Object.keys(state.statusDraft).length : 0;
    const selectedCount = !readOnly ? selectedStatusCellCount() : 0;
    const selectionModeActive = !readOnly && Boolean(state.statusSelectionMode);
    const statusOptions = [MODULE_STATUS.COMPLETED, MODULE_STATUS.NOT_COMPLETED, MODULE_STATUS.SCHEDULED, MODULE_STATUS.NOT_PARTICIPATING];

    return `
        <div class="space-y-6">
            <div class="flex justify-between items-end gap-4 flex-wrap">
                <div>
                    <h2 class="text-2xl font-bold text-slate-100">${escapeHtml(title)}</h2>
                    <p class="text-sm text-slate-300">${escapeHtml(description)}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${readOnly ? `
                        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                            Modo somente leitura
                        </span>
                    ` : ''}
                    ${showExportButton ? `
                        <button onclick="exportCsv()" class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50">
                            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Exportar CSV
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                ${statusOptions.map((status) => {
                    const visual = getModuleStatusVisual(status);
                    return `
                        <span class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600">
                            <span class="w-5 h-5 inline-flex items-center justify-center rounded-full border ${visual.dotClass}">
                                <i data-lucide="${visual.icon}" class="w-3 h-3 ${visual.dotIconClass}"></i>
                            </span>
                            ${escapeHtml(visual.label)}
                        </span>
                    `;
                }).join('')}
            </div>
            ${!readOnly ? `
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div class="flex items-center justify-between gap-3 flex-wrap">
                        <p class="text-sm font-semibold text-slate-800">
                            ${selectionModeActive
                                ? selectedCount && hasDraft
                                    ? `${formatCountLabel(selectedCount, 'módulo selecionado', 'módulos selecionados')} e ${formatCountLabel(draftCount, 'alteração pendente', 'alterações pendentes')}.`
                                    : selectedCount
                                        ? `${formatCountLabel(selectedCount, 'módulo selecionado', 'módulos selecionados')}.`
                                        : hasDraft
                                            ? `${formatCountLabel(draftCount, 'alteração pendente', 'alterações pendentes')}. Continue selecionando módulos ou salve as alterações.`
                                            : 'Modo seleção ativo. Clique nos módulos da matriz para selecionar.'
                                : hasDraft
                                    ? `${formatCountLabel(draftCount, 'alteração pendente', 'alterações pendentes')}. Clique em Selecionar para continuar editando.`
                                    : 'Clique em Selecionar para marcar os módulos que deseja alterar.'}
                        </p>
                        <div class="flex items-center gap-2">
                            ${selectionModeActive ? `
                                <button id="status-save-btn" onclick="saveStatusChanges()" ${statusBlocked || !hasDraft ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                    Salvar Alterações
                                </button>
                                <button onclick="clearStatusSelection(); render();" ${statusBlocked || !selectedCount ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed">
                                    Limpar seleção
                                </button>
                                <button onclick="cancelStatusChanges()" ${statusBlocked ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-sm font-bold hover:bg-amber-50 disabled:opacity-60 disabled:cursor-not-allowed">
                                    Cancelar Alteração
                                </button>
                            ` : `
                                <button onclick="toggleStatusSelectionMode()" ${statusBlocked ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed">
                                    Selecionar
                                </button>
                            `}
                        </div>
                    </div>
                    ${selectionModeActive ? `
                        <div class="space-y-2 text-center">
                            <p class="text-xs font-semibold text-slate-500">
                                Selecione para qual status deseja alterar.
                            </p>
                            <div class="flex flex-wrap items-center justify-center gap-2">
                                ${statusOptions.map((status) => {
                                    const visual = getModuleStatusVisual(status);
                                    const active = normalizeModuleStatus(state.bulkStatusTarget) === status;
                                    return `
                                        <button
                                            onclick="setStatusForSelectedCells('${escapeAttr(status)}')"
                                            ${statusBlocked || !selectedCount ? 'disabled' : ''}
                                            class="px-3 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 ${active ? 'bg-white border-slate-400 text-slate-900 shadow-sm ring-1 ring-slate-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <span class="w-5 h-5 inline-flex items-center justify-center rounded-full border ${visual.dotClass}">
                                                <i data-lucide="${visual.icon}" class="w-3 h-3 ${visual.dotIconClass}"></i>
                                            </span>
                                            ${escapeHtml(visual.label)}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100">
                ${hasModules ? `
                    <div class="fixed-scroll-target matrix-scroll w-full max-w-full overflow-x-auto" data-scroll-key="${escapeAttr(scrollKey)}">
                        <table class="min-w-max text-left border-collapse matrix-table">
                            <thead>
                                <tr class="bg-slate-800 text-white">
                                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest sticky-col z-20 bg-slate-800">Usuário</th>
                                    ${matrixCategories.map((category) => `
                                        <th colspan="${Math.max(category.modules.length, 1)}" class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-slate-700 bg-slate-700/50">
                                            ${escapeHtml(category.name)}
                                        </th>
                                    `).join('')}
                                </tr>
                                <tr class="bg-slate-50">
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase sticky-col z-10 bg-slate-50">Dados</th>
                                    ${matrixCategories.map((category) => category.modules.length
                                        ? category.modules.map((module) => `
                                            <th class="px-3 py-4 text-[9px] font-bold text-slate-400 uppercase text-center min-w-[120px]">
                                                ${escapeHtml(module.name)}
                                            </th>
                                        `).join('')
                                        : '<th class="px-3 py-4 text-[9px] font-bold text-slate-300 uppercase text-center min-w-[120px]">Sem módulos</th>'
                                    ).join('')}
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${filteredUsers.length ? filteredUsers.map((user) => `
                                    <tr class="hover:bg-indigo-50/20 group">
                                        <td class="px-6 py-4 sticky-col z-10 group-hover:bg-indigo-50/20">
                                            <div class="flex items-center gap-3">
                                                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] uppercase">
                                                    ${escapeHtml(`${user.firstName[0] || ''}${user.lastName[0] || ''}`)}
                                                </div>
                                                <div>
                                                    <p class="font-bold text-xs">${escapeHtml(user.fullName)}</p>
                                                    <p class="text-[9px] text-slate-400 font-bold uppercase">${escapeHtml(user.role)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        ${matrixCategories.map((category) => category.modules.length
                                            ? category.modules.map((module) => {
                                                const assigned = user.categoryIds.includes(category.id);
                                                const status = assigned
                                                    ? getModuleStatus(user, category.id, module.id)
                                                    : MODULE_STATUS.NOT_PARTICIPATING;
                                                const selected = assigned && !readOnly && isStatusCellSelected(user.id, category.id, module.id);
                                                const statusVisual = getModuleStatusVisual(status);
                                                const statusLabel = getModuleStatusLabel(status);
                                                const statusIcon = `
                                                    <span class="w-9 h-9 inline-flex items-center justify-center rounded-full border ${statusVisual.dotClass}">
                                                        <i data-lucide="${statusVisual.icon}" class="w-4 h-4 ${statusVisual.dotIconClass}"></i>
                                                    </span>
                                                `;
                                                const buttonTitle = !selectionModeActive
                                                    ? `${statusLabel}. Clique em Selecionar para marcar este módulo.`
                                                    : selected
                                                        ? `${statusLabel}. Clique para remover da seleção.`
                                                        : `${statusLabel}. Clique para selecionar este módulo.`;
                                                return `
                                                    <td class="${assigned ? 'px-2 py-3 text-center' : 'px-2 py-4 text-center bg-slate-50/50'}">
                                                        ${assigned && !readOnly ? `
                                                            <button onclick="toggleCompletion('${user.id}', '${category.id}', '${module.id}')" ${statusBlocked || !selectionModeActive ? 'disabled' : ''} title="${escapeAttr(buttonTitle)}" class="status-selectable-cell-button w-10 h-10 inline-flex items-center justify-center rounded-full transition-all transform active:scale-95 ${selected ? 'ring-2 ring-blue-500 bg-blue-50 shadow-sm' : (selectionModeActive ? 'hover:bg-slate-100' : '')} disabled:opacity-60 disabled:cursor-not-allowed">
                                                                ${statusIcon}
                                                            </button>
                                                        ` : `
                                                            <div class="w-10 h-10 inline-flex items-center justify-center rounded-full mx-auto" title="${escapeAttr(statusLabel)}">${statusIcon}</div>
                                                        `}
                                                    </td>
                                                `;
                                            }).join('')
                                            : '<td class="bg-slate-50/50"></td>'
                                        ).join('')}
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="${matrixCategories.reduce((sum, category) => sum + Math.max(category.modules.length, 1), 1) + 1}" class="px-6 py-12 text-center text-slate-400">
                                            Nenhum usuário encontrado para o filtro atual.
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="p-10 text-center text-slate-500">
                        Cadastre ao menos um módulo para exibir a matriz.
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderPublicOverview(container) {
    const filteredUsers = getUsersForMatrixView(state.publicMatrixFilters);
    const matrixCategories = getVisibleMatrixCategories(state.publicMatrixFilters);

    const matrixMarkup = getMatrixSectionMarkup(
        'Matriz Pública de Treinamentos',
        'Mesma visão de categorias, módulos e checks da administração, sem edição.',
        { readOnly: true, scrollKey: 'public-matrix', filteredUsers, matrixCategories }
    );

    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            ${getMatrixFiltersMarkup('public')}
            ${state.publicDataError ? `
                <div class="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700">
                    ${escapeHtml(state.publicDataError)}
                </div>
            ` : ''}
            ${matrixMarkup}
        </div>
    `;
}

function getDashboardInsights() {
    const roleCounts = new Map();

    for (const user of state.users) {
        const role = String(user.role || '').trim() || 'Nao informado';
        roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
    }

    const roleDistribution = [...roleCounts.entries()]
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role, 'pt-BR', { sensitivity: 'base' }));

    return {
        totalUsers: state.users.length,
        roleDistribution,
    };
}

function getDashboardStatusDistribution(filterState) {
    const filteredUsers = getUsersForMatrixView(filterState);
    const matrixCategories = getVisibleMatrixCategories(filterState);
    const counts = {
        [MODULE_STATUS.COMPLETED]: 0,
        [MODULE_STATUS.NOT_COMPLETED]: 0,
        [MODULE_STATUS.SCHEDULED]: 0,
        [MODULE_STATUS.NOT_PARTICIPATING]: 0,
    };

    let totalRecords = 0;
    for (const user of filteredUsers) {
        for (const category of matrixCategories) {
            const assigned = user.categoryIds.includes(category.id);
            for (const module of category.modules) {
                const rawStatus = assigned
                    ? getModuleStatus(user, category.id, module.id)
                    : MODULE_STATUS.NOT_PARTICIPATING;
                const normalizedStatus = normalizeModuleStatus(rawStatus);
                counts[normalizedStatus] = (counts[normalizedStatus] || 0) + 1;
                totalRecords += 1;
            }
        }
    }

    return {
        filteredUsers,
        matrixCategories,
        counts,
        totalRecords,
    };
}

function renderDashboard(container) {
    const insights = getDashboardInsights();
    const filterState = getMatrixFilterState('dashboard');
    const distribution = getDashboardStatusDistribution(filterState);
    const maxRoleCount = Math.max(...insights.roleDistribution.map((item) => item.count), 1);
    const selectedModulesCount = distribution.matrixCategories
        .reduce((sum, category) => sum + category.modules.length, 0);

    const statusChartItems = [
        {
            status: MODULE_STATUS.COMPLETED,
            label: 'Concluído',
            color: '#10b981',
            count: distribution.counts[MODULE_STATUS.COMPLETED],
        },
        {
            status: MODULE_STATUS.NOT_COMPLETED,
            label: 'Não Concluído',
            color: '#f43f5e',
            count: distribution.counts[MODULE_STATUS.NOT_COMPLETED],
        },
        {
            status: MODULE_STATUS.SCHEDULED,
            label: 'Agendado',
            color: '#f59e0b',
            count: distribution.counts[MODULE_STATUS.SCHEDULED],
        },
        {
            status: MODULE_STATUS.NOT_PARTICIPATING,
            label: 'Não inscrito',
            color: '#475569',
            count: distribution.counts[MODULE_STATUS.NOT_PARTICIPATING],
        },
    ];

    const totalStatusRecords = distribution.totalRecords;
    const pieGradientStops = [];
    let currentOffset = 0;
    for (const item of statusChartItems) {
        if (!item.count || !totalStatusRecords) {
            continue;
        }

        const start = currentOffset;
        const percentage = (item.count / totalStatusRecords) * 100;
        currentOffset += percentage;
        pieGradientStops.push(`${item.color} ${start.toFixed(2)}% ${currentOffset.toFixed(2)}%`);
    }

    const pieStyle = pieGradientStops.length
        ? `background: conic-gradient(${pieGradientStops.join(', ')});`
        : 'background: #e2e8f0;';

    const matrixMarkup = getMatrixSectionMarkup(
        'Matriz Geral',
        'Principal visão do painel: acompanhe quem concluiu cada módulo.'
    );

    container.innerHTML = `
        <div class="space-y-8">
            <div class="space-y-5">
                <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-100">Painel de Indicadores</h2>
                        <p class="text-sm text-slate-300">Visão direta de usuários, cargos e status dos treinamentos por categoria/módulo.</p>
                    </div>
                </div>

                ${getMatrixFiltersMarkup('dashboard')}

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400">Total de usuários</p>
                        <p data-dashboard-number="total-users" data-target="${insights.totalUsers}" class="mt-2 text-3xl font-black text-slate-800">${insights.totalUsers}</p>
                        <p class="mt-1 text-xs text-slate-500">base completa cadastrada</p>
                    </div>
                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400">Usuários filtrados</p>
                        <p data-dashboard-number="filtered-users" data-target="${distribution.filteredUsers.length}" class="mt-2 text-3xl font-black text-slate-800">${distribution.filteredUsers.length}</p>
                        <p class="mt-1 text-xs text-slate-500">considerando busca e cargo</p>
                    </div>
                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400">Módulos filtrados</p>
                        <p data-dashboard-number="selected-modules" data-target="${selectedModulesCount}" class="mt-2 text-3xl font-black text-slate-800">${selectedModulesCount}</p>
                        <p class="mt-1 text-xs text-slate-500">dentro das categorias selecionadas</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div class="flex items-center justify-between gap-3">
                            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Usuários por cargo</h3>
                            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Distribuição</span>
                        </div>
                        ${insights.roleDistribution.length ? `
                            <div class="mt-4 space-y-3">
                                ${insights.roleDistribution.map((item) => `
                                    <div>
                                        <div class="flex items-center justify-between gap-2 text-xs">
                                            <span class="font-semibold text-slate-700 truncate">${escapeHtml(item.role)}</span>
                                            <span class="text-slate-500 font-bold">${item.count}</span>
                                        </div>
                                        <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div class="h-full rounded-full bg-slate-700" style="width:${Math.min(100, Math.max(0, Math.round((item.count / maxRoleCount) * 100)))}%;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <p class="mt-4 text-sm text-slate-400">Nenhum cargo disponível.</p>
                        `}
                    </div>

                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div class="flex items-center justify-between gap-3">
                            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Status do treinamento (pizza)</h3>
                            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Concluído x Não concluído x Agendado x Não inscrito</span>
                        </div>
                        ${totalStatusRecords ? `
                            <div class="mt-4 grid grid-cols-1 md:grid-cols-[170px_1fr] gap-4 items-center">
                                <div class="flex items-center justify-center">
                                    <div
                                        data-dashboard-pie
                                        class="w-40 h-40 rounded-full border-8 border-white shadow-inner dashboard-pie-enter"
                                        style="${pieStyle}"
                                        aria-label="Gráfico de pizza por status dos treinamentos"
                                    ></div>
                                </div>
                                <div class="space-y-2.5">
                                    ${statusChartItems.map((item) => {
                                        const percentage = totalStatusRecords ? Math.round((item.count / totalStatusRecords) * 100) : 0;
                                        return `
                                            <div class="flex items-center justify-between gap-3 text-sm">
                                                <div class="flex items-center gap-2 min-w-0">
                                                    <span class="w-3 h-3 rounded-full shrink-0" style="background:${item.color};"></span>
                                                    <span class="font-semibold text-slate-700 truncate">${escapeHtml(item.label)}</span>
                                                </div>
                                                <span data-dashboard-number="status-${escapeAttr(normalizeComparisonKey(item.status))}" data-target="${item.count}" data-suffix=" (${percentage}%)" class="text-slate-500 font-bold">${item.count} (${percentage}%)</span>
                                            </div>
                                        `;
                                    }).join('')}
                                    <p class="pt-2 text-xs text-slate-400">
                                        Base: ${distribution.filteredUsers.length} usuário(s) x ${selectedModulesCount} módulo(s) selecionado(s) = ${totalStatusRecords} registro(s).
                                    </p>
                                </div>
                            </div>
                        ` : `
                            <div class="mt-6 space-y-3">
                                <div class="w-40 h-40 mx-auto rounded-full bg-slate-200 border-8 border-white"></div>
                                <p class="text-sm text-slate-400 text-center">
                                    Selecione categorias e módulos com dados para gerar o gráfico de pizza.
                                </p>
                            </div>
                        `}
                    </div>
                </div>

                <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div class="flex items-center justify-between gap-3">
                        <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Legenda de status</h3>
                    </div>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        ${statusChartItems.map((item) => `
                            <div class="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full shrink-0" style="background:${item.color};"></span>
                                <span class="font-semibold text-slate-700">${escapeHtml(item.label)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            ${matrixMarkup}
        </div>
    `;
}

function animateDashboardIndicators() {
    const mainView = document.getElementById('main-view');
    if (!mainView || state.activeTab !== 'dashboard') {
        return;
    }

    const numberNodes = Array.from(mainView.querySelectorAll('[data-dashboard-number]'));
    const durationMs = 520;
    const startAt = performance.now();

    numberNodes.forEach((node) => {
        const key = String(node.dataset.dashboardNumber || '').trim();
        if (!key) {
            return;
        }

        const target = Number(node.dataset.target || 0);
        const previousRaw = state.dashboardAnimationValues[key];
        const start = Number.isFinite(previousRaw) ? Number(previousRaw) : 0;
        const suffix = String(node.dataset.suffix || '');

        node.textContent = `${Math.round(start)}${suffix}`;

        const animateFrame = (now) => {
            const progress = Math.min(1, (now - startAt) / durationMs);
            const eased = 1 - ((1 - progress) * (1 - progress) * (1 - progress));
            const nextValue = start + ((target - start) * eased);
            node.textContent = `${Math.round(nextValue)}${suffix}`;
            if (progress < 1) {
                window.requestAnimationFrame(animateFrame);
                return;
            }
            node.textContent = `${Math.round(target)}${suffix}`;
            state.dashboardAnimationValues[key] = target;
        };

        window.requestAnimationFrame(animateFrame);
    });

}

function renderCategories(container) {
    const actionsBlocked = isPending('loadData') || isPending('saveCategory') || isPending('deleteCategory');
    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            <div class="flex justify-between items-center gap-4 flex-wrap">
                <div>
                    <h2 class="text-2xl font-bold text-slate-100">Gestão de Categorias</h2>
                    <p class="text-sm text-slate-400">Crie, edite e exclua categorias com seus módulos.</p>
                </div>
                <button onclick="openModal('category')" ${actionsBlocked ? 'disabled' : ''} class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
                    <i data-lucide="plus" class="w-5 h-5"></i> Nova Categoria
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${state.categories.length ? state.categories.map((category) => {
                    const isExpanded = state.expandedCategoryId === category.id;
                    const assignedUsersCount = state.users.filter((user) => user.categoryIds.includes(category.id)).length;
                    const isInlineEditing = state.inlineModuleEditor.categoryId === category.id;
                    const inlineModules = isInlineEditing ? state.inlineModuleEditor.modules : [];
                    return `
                        <div class="relative bg-white rounded-2xl border border-slate-100 overflow-visible ${isExpanded ? 'z-30' : 'z-0'}">
                            <div class="p-5">
                                <div class="flex items-start justify-between gap-3">
                                    <button onclick="toggleCategoryModules('${category.id}')" class="flex items-start gap-3 text-left min-w-0 flex-1">
                                        <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0"><i data-lucide="layers"></i></span>
                                        <span class="min-w-0">
                                            <span class="block text-lg font-bold truncate text-slate-800">${escapeHtml(category.name)}</span>
                                            <span class="block text-xs text-slate-400 font-bold uppercase tracking-wider">${category.modules.length} módulos - ${assignedUsersCount} usuários</span>
                                        </span>
                                        <span class="text-slate-400 shrink-0 mt-1"><i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5"></i></span>
                                    </button>
                                    <div class="flex items-center gap-2 shrink-0">
                                        <button onclick="viewCategory('${category.id}')" class="px-3 py-2 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all">
                                            Ver usuários
                                        </button>
                                        ${isExpanded ? `
                                            <button onclick="editCategory('${category.id}')" ${actionsBlocked ? 'disabled' : ''} class="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                                            </button>
                                        ` : ''}
                                        <button onclick="deleteCategory('${category.id}')" ${actionsBlocked ? 'disabled' : ''} class="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-lg border border-red-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                                ${isExpanded ? `
                                    <div class="absolute left-0 right-0 top-full mt-2 rounded-xl border border-slate-100 bg-slate-50/95 p-4 shadow-xl animate-fade-in">
                                        <div class="flex items-center justify-between gap-2">
                                            <p class="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Módulos cadastrados</p>
                                            ${isInlineEditing ? `
                                                <div class="flex items-center gap-2">
                                                    <button onclick="addInlineModuleDraft()" ${actionsBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed">
                                                        Adicionar
                                                    </button>
                                                    <button onclick="cancelInlineModuleEdit()" ${actionsBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed">
                                                        Cancelar
                                                    </button>
                                                    <button onclick="saveInlineModuleEdit('${category.id}')" ${actionsBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                                        Salvar
                                                    </button>
                                                </div>
                                            ` : `
                                                <button onclick="startInlineModuleEdit('${category.id}')" ${actionsBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5">
                                                    <i data-lucide="square-pen" class="w-3.5 h-3.5"></i>
                                                    Editar módulos
                                                </button>
                                            `}
                                        </div>
                                        ${isInlineEditing ? `
                                            <div class="mt-3 space-y-2">
                                                ${inlineModules.length ? inlineModules.map((module, index) => {
                                                    const moduleName = String(module.name || '');
                                                    const isModuleEditing = state.inlineModuleEditor.editingIndex === index;
                                                    return `
                                                        <div class="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 flex items-center gap-2">
                                                            <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">${index + 1}</span>
                                                            ${isModuleEditing ? `
                                                                <input
                                                                    id="inline-module-input-${index}"
                                                                    type="text"
                                                                    value="${escapeAttr(moduleName)}"
                                                                    oninput="updateInlineModuleDraft(${index}, this.value)"
                                                                    onkeydown="handleInlineModuleInputKeydown(event, ${index})"
                                                                    class="flex-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400"
                                                                >
                                                            ` : `
                                                                <span class="flex-1 truncate font-semibold ${moduleName.trim() ? 'text-slate-700' : 'text-slate-400 italic'}">${escapeHtml(moduleName.trim() || 'Sem nome')}</span>
                                                            `}
                                                            <button onclick="${isModuleEditing ? `finishInlineModuleFieldEdit(${index})` : `beginInlineModuleFieldEdit(${index})`}" class="p-1.5 rounded-md bg-slate-50 text-slate-500 hover:text-indigo-600 border border-slate-200" title="${isModuleEditing ? 'Concluir edição' : 'Editar nome do módulo'}">
                                                                <i data-lucide="${isModuleEditing ? 'check' : 'pencil'}" class="w-3.5 h-3.5"></i>
                                                            </button>
                                                            <button onclick="confirmInlineModuleDeletion(${index})" class="p-1.5 rounded-md bg-red-50 text-red-500 hover:text-red-700 border border-red-100" title="Excluir módulo">
                                                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                                            </button>
                                                        </div>
                                                    `;
                                                }).join('') : `
                                                    <p class="text-sm text-slate-400">Adicione ao menos um módulo.</p>
                                                `}
                                            </div>
                                        ` : category.modules.length ? `
                                            <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                ${category.modules.map((module, index) => `
                                                    <div class="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 flex items-center gap-2">
                                                        <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center">${index + 1}</span>
                                                        <span class="truncate font-semibold">${escapeHtml(module.name)}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : `
                                            <p class="mt-3 text-sm text-slate-400">Esta categoria ainda não possui módulos.</p>
                                        `}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="md:col-span-2 p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
                        Nenhuma categoria foi criada ainda.
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderReport(container) {
    const filteredUsers = getUsersForMatrixView(state.reportMatrixFilters);
    const matrixCategories = getVisibleMatrixCategories(state.reportMatrixFilters);

    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            ${getMatrixFiltersMarkup('report')}
            ${getMatrixSectionMarkup('Matriz de Conclusão', 'Visão global de todos os módulos por usuário', { filteredUsers, matrixCategories })}
        </div>
    `;
}

function renderUsers(container) {
    const filteredUsers = getUsersForManagement();
    const actionsBlocked = isPending('loadData') || isPending('saveUser') || isPending('deleteUser') || isPending('importUsers') || isPending('normalizeRoles');
    const roleOptions = [...new Set(state.users.map((user) => user.role).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            <div class="flex justify-between items-center gap-4 flex-wrap">
                <div>
                    <h2 class="text-2xl font-bold text-slate-100">Gestão de Usuários</h2>
                    <p class="text-sm text-slate-400">Mantenha os colaboradores e suas categorias sincronizados no Supabase.</p>
                </div>
                <div class="flex items-center gap-2">
                    <input id="user-import-input" type="file" accept=".csv,text/csv" class="hidden" onchange="handleUserCsvSelected(event)">
                    <button onclick="downloadUsersCsvTemplate()" class="px-4 py-2.5 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
                        <i data-lucide="file-down" class="w-4 h-4"></i> Modelo CSV
                    </button>
                    <button onclick="triggerUserCsvImport()" ${actionsBlocked ? 'disabled' : ''} class="px-4 py-2.5 bg-white text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        <i data-lucide="upload" class="w-4 h-4"></i> Importar CSV
                    </button>
                    <button onclick="normalizeAllUserRoles()" ${actionsBlocked ? 'disabled' : ''} class="px-4 py-2.5 bg-white text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        <i data-lucide="wand-sparkles" class="w-4 h-4"></i> Padronizar Cargos
                    </button>
                    <button onclick="openModal('user')" ${actionsBlocked ? 'disabled' : ''} class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
                        <i data-lucide="plus" class="w-5 h-5"></i> Novo Usuário
                    </button>
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-slate-100 p-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div class="md:col-span-2">
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Pesquisar</label>
                        <input
                            value="${escapeAttr(state.searchQuery)}"
                            oninput="handleSearch(this.value)"
                            class="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400"
                            placeholder="Nome, cargo ou categoria"
                        >
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Cargo</label>
                        <select onchange="setUserListRoleFilter(this.value)" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400">
                            <option value="all" ${state.userListFilters.role === 'all' ? 'selected' : ''}>Todos</option>
                            ${roleOptions.map((role) => `
                                <option value="${escapeAttr(role)}" ${state.userListFilters.role === role ? 'selected' : ''}>${escapeHtml(role)}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Ordem</label>
                        <select onchange="setUserListSort(this.value)" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400">
                            <option value="name-asc" ${state.userListFilters.sort === 'name-asc' ? 'selected' : ''}>Nome A-Z</option>
                            <option value="name-desc" ${state.userListFilters.sort === 'name-desc' ? 'selected' : ''}>Nome Z-A</option>
                            <option value="role-asc" ${state.userListFilters.sort === 'role-asc' ? 'selected' : ''}>Cargo A-Z</option>
                            <option value="role-desc" ${state.userListFilters.sort === 'role-desc' ? 'selected' : ''}>Cargo Z-A</option>
                        </select>
                    </div>
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Categoria:</span>
                    <button onclick="setUserListCategoryFilter('all')" class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${state.userListFilters.categoryId === 'all' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}">Todas</button>
                    ${state.categories.map((category) => `
                        <button
                            data-category-id="${escapeAttr(category.id)}"
                            onclick="setUserListCategoryFilter(this.dataset.categoryId)"
                            class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${state.userListFilters.categoryId === category.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}"
                        >
                            ${escapeHtml(category.name)}
                        </button>
                    `).join('')}
                    <button onclick="clearUserListFilters()" class="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                        Limpar filtros
                    </button>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="fixed-scroll-target w-full max-w-full overflow-x-auto" data-scroll-key="users-management-table">
                    <table class="w-full min-w-max text-left">
                        <thead class="bg-slate-50 border-b">
                            <tr>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nome</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Cargo</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">ID Externo</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Categorias (marque e salve)</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${filteredUsers.length ? filteredUsers.map((user) => `
                                <tr class="hover:bg-slate-50/50 group transition-colors">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3 font-bold text-slate-700 text-sm">
                                            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] uppercase">
                                                ${escapeHtml(`${user.firstName[0] || ''}${user.lastName[0] || ''}`)}
                                            </div>
                                            ${escapeHtml(user.fullName)}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-xs text-slate-500 font-medium">${escapeHtml(user.role)}</td>
                                    <td class="px-6 py-4 text-xs text-slate-500 font-medium">${escapeHtml(user.externalId)}</td>
                                    <td class="px-6 py-4">
                                        <div class="flex gap-1.5 flex-wrap">
                                            ${state.categories.length
                                                ? state.categories.map((category) => {
                                                    const activeCategoryIds = getEffectiveUserCategoryIds(user);
                                                    const active = activeCategoryIds.includes(category.id);
                                                    const savingDraft = isUserCategoryDraftSaving(user.id);
                                                    return `
                                                        <button onclick="toggleUserCategoryQuick('${user.id}', '${category.id}')" ${actionsBlocked || savingDraft ? 'disabled' : ''} class="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'} ${savingDraft ? 'opacity-70' : ''} disabled:opacity-60 disabled:cursor-not-allowed">
                                                            ${escapeHtml(category.name)}
                                                        </button>
                                                    `;
                                                }).join('')
                                                : '<span class="text-xs text-slate-300">Sem categorias cadastradas</span>'}
                                        </div>
                                        ${isUserCategoryDraftDirty(user.id) || isUserCategoryDraftSaving(user.id) ? `
                                            <div class="mt-2 flex items-center gap-2">
                                                <button onclick="saveUserCategoryQuickChanges('${user.id}')" ${actionsBlocked || isUserCategoryDraftSaving(user.id) ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                                    ${isUserCategoryDraftSaving(user.id) ? 'Salvando...' : 'Salvar'}
                                                </button>
                                                <button onclick="cancelUserCategoryQuickChanges('${user.id}')" ${actionsBlocked || isUserCategoryDraftSaving(user.id) ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed">
                                                    Cancelar
                                                </button>
                                            </div>
                                        ` : ''}
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onclick="editUser('${user.id}')" ${actionsBlocked ? 'disabled' : ''} class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                                            </button>
                                            <button onclick="deleteUser('${user.id}')" ${actionsBlocked ? 'disabled' : ''} class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="5" class="px-6 py-12 text-center text-slate-400">Nenhum usuário cadastrado ainda.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderCategoryDetail(container) {
    const category = getCurrentCategory();
    if (!category) {
        state.activeTab = 'categories';
        render();
        return;
    }

    const assignedUsers = state.users
        .filter((user) => user.categoryIds.includes(category.id))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-4">
                    <button onclick="switchTab('categories')" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <i data-lucide="arrow-left" class="w-6 h-6"></i>
                    </button>
                    <div>
                        <h2 class="text-2xl font-bold text-slate-100">${escapeHtml(category.name)}</h2>
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Usuários vinculados à categoria</p>
                    </div>
                </div>
                <button onclick="switchTab('categories'); toggleCategoryModules('${category.id}')" class="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 hover:bg-slate-50">
                    Ver módulos da categoria
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-5 bg-white border border-slate-100 rounded-2xl">
                    <p class="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Módulos</p>
                    <p class="mt-2 text-3xl font-black text-slate-800">${category.modules.length}</p>
                </div>
                <div class="p-5 bg-white border border-slate-100 rounded-2xl">
                    <p class="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Usuários na categoria</p>
                    <p class="mt-2 text-3xl font-black text-slate-800">${assignedUsers.length}</p>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <p class="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Módulos cadastrados</p>
                ${category.modules.length ? `
                    <div class="mt-3 flex flex-wrap gap-2">
                        ${category.modules.map((module) => `
                            <span class="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                ${escapeHtml(module.name)}
                            </span>
                        `).join('')}
                    </div>
                ` : `
                    <p class="mt-3 text-sm text-slate-400">Esta categoria ainda não possui módulos.</p>
                `}
            </div>
            <div class="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Usuários cadastrados na categoria</h3>
                    <button onclick="switchTab('users')" class="text-xs font-bold px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">
                        Ir para Usuários
                    </button>
                </div>
                ${assignedUsers.length ? `
                    <div class="divide-y divide-slate-100">
                        ${assignedUsers.map((user) => `
                            <div class="px-6 py-4 flex items-center justify-between gap-3">
                                <div class="min-w-0">
                                    <p class="font-bold text-sm text-slate-800 truncate">${escapeHtml(user.fullName)}</p>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${escapeHtml(user.role)}</p>
                                </div>
                                <span class="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase text-slate-500 shrink-0">
                                    ${escapeHtml(user.externalId)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="p-10 text-center text-slate-400">
                        Nenhum usuário vinculado a esta categoria.
                    </div>
                `}
            </div>
        </div>
    `;
}


