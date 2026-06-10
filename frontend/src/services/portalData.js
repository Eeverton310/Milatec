import { reactive } from 'vue';
import { fetchDashboard } from './portalDataApi';
import { getAdminDashboard } from './adminApi';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatCurrency(value) {
  if (value == null || isNaN(Number(value))) return 'R$ 0,00';
  return currencyFormatter.format(Number(value));
}

function formatDate(isoDate) {
  if (!isoDate) return 'Sem data';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'Sem data';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Sem data';
  }
}

function getDeliveryTone(stage) {
  if (!stage) return 'info';
  const lower = stage.toLowerCase();
  if (lower.includes('entreg') || lower.includes('conclu')) return 'success';
  if (lower.includes('separ') || lower.includes('progress')) return 'warning';
  if (lower.includes('cancel')) return 'danger';
  return 'info';
}

function isStageInProgress(stage) {
  if (!stage) return false;
  const lower = stage.toLowerCase();
  const finalStages = ['conclu', 'finaliz', 'cancel', 'entregue'];
  return !finalStages.some((s) => lower.includes(s));
}

function adaptClientPortalData(dashboard) {
  const {
    company,
    contact,
    summary,
    budgets = [],
    projects = [],
    deliveries = [],
    documents = [],
  } = dashboard;

  // Mapas auxiliares
  const budgetById = new Map(budgets.map((b) => [b.id, b]));
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const deliveryById = new Map(deliveries.map((d) => [d.id, d]));

  // ---------------------------------------------------------------------------
  // OBRAS = ORÇAMENTOS
  // Cada orçamento da empresa vira uma "obra" no portal. Projetos e entregas
  // são vinculados a partir dos próprios campos do orçamento (linkedProjects /
  // linkedDeliveries) — e não mais da tabela Instalações.
  // ---------------------------------------------------------------------------
  const adaptedWorks = budgets.map((budget) => {
    const linkedProjects = (budget.linkedProjects || [])
      .map((id) => projectById.get(id))
      .filter(Boolean);
    const linkedDeliveries = (budget.linkedDeliveries || [])
      .map((id) => deliveryById.get(id))
      .filter(Boolean);

    return {
      id: budget.id,
      name: budget.name || 'Obra',
      city: budget.city || 'Local não informado',
      stage: budget.stage || 'Informação em atualização',
      budgetType: budget.budgetType || 'Tipo não informado',
      product: budget.product || 'Informação em atualização',
      value: budget.value,
      formattedValue: formatCurrency(budget.value),
      closingDate: formatDate(budget.closingDate),
      deliveryAddress: budget.deliveryAddress || 'Endereço não informado',
      linkedProjects,
      linkedDeliveries,
      attachments: budget.attachments || [],
    };
  });

  // Adaptar orçamentos (lista própria do módulo Orçamentos)
  const adaptedBudgets = budgets.map((budget) => ({
    id: budget.id,
    name: budget.name || budget.product || 'Orçamento',
    value: budget.value,
    formattedValue: formatCurrency(budget.value),
    stage: budget.stage,
    budgetType: budget.budgetType || 'Tipo não informado',
    closingDate: formatDate(budget.closingDate),
    city: budget.city || 'Local não informado',
    active: budget.stage ? isStageInProgress(budget.stage) : true,
    linkedProjects: budget.linkedProjects || [],
    linkedDeliveries: budget.linkedDeliveries || [],
  }));

  // Adaptar projetos — vinculados ao orçamento (obra) correto
  const adaptedProjects = projects.map((project) => {
    // Encontra o orçamento que referencia este projeto
    const parentBudget = budgets.find((b) =>
      (b.linkedProjects || []).includes(project.id),
    );

    return {
      id: project.id,
      workId: parentBudget?.id || '',
      workName: parentBudget?.name || 'Obra não vinculada',
      name: project.name,
      product: project.budgetType || project.product || 'Produto não informado',
      location: parentBudget?.city || 'Local não informado',
      type: project.budgetType || 'Tipo não informado',
      stage: project.stage,
      quantity: project.weight ? `${project.weight} kg` : 'Quantidade não informada',
      unitValue: 'A informar',
      totalValue: parentBudget?.value
        ? formatCurrency(parentBudget.value)
        : 'A informar',
      inProgress: isStageInProgress(project.stage),
    };
  });

  const adaptedProjectById = new Map(adaptedProjects.map((p) => [p.id, p]));

  // Adaptar entregas — vinculadas ao orçamento (obra) correto
  const adaptedDeliveries = deliveries.map((delivery) => {
    const parentBudget = (delivery.linkedBudgets || [])
      .map((id) => budgetById.get(id))
      .find(Boolean);
    const linkedProject = (parentBudget?.linkedProjects || [])
      .map((id) => adaptedProjectById.get(id))
      .find(Boolean);

    const hasDate = Boolean(delivery.deliveryDate);

    return {
      id: delivery.id,
      workId: parentBudget?.id || '',
      workName: parentBudget?.name || 'Obra não vinculada',
      name: `Lote — ${delivery.stage || 'Entrega'}`,
      date: formatDate(delivery.deliveryDate),
      displayDate: formatDate(delivery.deliveryDate),
      invoiceDate: formatDate(delivery.deliveryDate),
      hasDate,
      quantity: delivery.quantity ? `${delivery.quantity} un.` : 'A definir',
      value: delivery.value ? formatCurrency(delivery.value) : 'A informar',
      status: delivery.stage || 'Programada',
      stage: delivery.stage || 'Programada',
      tone: getDeliveryTone(delivery.stage),
      projectName: linkedProject?.name || 'Projeto não vinculado',
      deliveryAddress:
        parentBudget?.deliveryAddress || delivery.city || 'Endereço não informado',
      invoiceAttachment: null,
      packingListAttachment: null,
      purchaseOrderAttachment: null,
    };
  });

  // ---------------------------------------------------------------------------
  // ANEXOS / DOCUMENTOS
  // Vêm de Orçamentos e Entregas (Instalações foi removido no backend).
  // Cada documento traz budgetId/budgetName para o vínculo com a obra.
  // ---------------------------------------------------------------------------
  const adaptedAttachments = documents.map((doc) => {
    let entityType = 'documento';
    let linkedTypeLabel = 'Documento';

    if (doc.source === 'Orçamentos') {
      entityType = 'orcamento';
      linkedTypeLabel = 'Obra';
    } else if (doc.source === 'Entregas') {
      entityType = 'entrega';
      linkedTypeLabel = 'Entrega';
    }

    // Nome da obra/orçamento vinculado
    const linkedRecordName =
      doc.budgetName ||
      budgetById.get(doc.budgetId)?.name ||
      budgetById.get(doc.recordId)?.name ||
      doc.recordId ||
      '-';

    // Obras e projetos relacionados (para os filtros da tela)
    const relatedWorkIds = [];
    const relatedWorkNames = [];
    const relatedProjectIds = [];
    const relatedProjectNames = [];

    const parentBudget =
      budgetById.get(doc.budgetId) || budgetById.get(doc.recordId);

    if (parentBudget) {
      relatedWorkIds.push(parentBudget.id);
      relatedWorkNames.push(parentBudget.name);

      (parentBudget.linkedProjects || []).forEach((projectId) => {
        const project = projectById.get(projectId);
        if (project) {
          relatedProjectIds.push(project.id);
          relatedProjectNames.push(project.name);
        }
      });
    }

    return {
      id: doc.id,
      name: doc.filename,
      category: doc.category || 'Documento',
      uploadedAt: 'Disponível',
      href: doc.url,
      actionLabel: 'Baixar',
      entityType,
      entityId: doc.budgetId || doc.recordId,
      linkedTypeLabel,
      linkedRecordName,
      relatedWorkIds,
      relatedWorkNames,
      relatedProjectIds,
      relatedProjectNames,
    };
  });

  return {
    company: {
      name: company?.name || 'Empresa não informada',
      cityState: company?.state || 'Local não informado',
      primaryContact: contact?.name || 'Contato não informado',
      primaryEmail: contact?.email || '-',
      primaryPhone: contact?.phone || '-',
    },
    works: adaptedWorks,
    budgets: adaptedBudgets,
    projects: adaptedProjects,
    deliveries: adaptedDeliveries,
    attachments: adaptedAttachments,
    summaryCards: [
      {
        label: 'Obras',
        value: String(adaptedWorks.length),
        detail: `${adaptedProjects.length} projetos vinculados`,
        accent: '#004AE8',
      },
      {
        label: 'Orçamentos ativos',
        value: String(adaptedBudgets.filter((b) => b.active).length),
        detail: `${adaptedBudgets.length} orçamentos liberados para consulta`,
        accent: '#050866',
      },
      {
        label: 'Entregas programadas',
        value: String(adaptedDeliveries.filter((d) => d.hasDate).length),
        detail: `${adaptedDeliveries.filter((d) => !d.hasDate).length} entregas aguardando data`,
        accent: '#00A34A',
      },
      {
        label: 'Valor acompanhado',
        value: formatCurrency(summary?.financial?.totalBudgetValue ?? 0),
        detail: 'Soma dos orçamentos visíveis para a empresa',
        accent: '#B7791F',
      },
    ],
    readOnlyRules: [
      'Esta área reúne apenas os dados vinculados à empresa autenticada e ao contato principal.',
      'Os registros exibidos aqui servem para acompanhamento das obras, projetos, entregas e anexos.',
      'Os anexos respeitam as liberações disponíveis para esta conta.',
    ],
  };
}

export async function getClientPortalData() {
  const dashboard = await fetchDashboard();
  return adaptClientPortalData(dashboard);
}


const adminState = reactive({
  summaryCards: [],
  customers: [],
  works: [],
  projects: [],
  deliveries: [],
  attachments: [],
  accessSummary: [],
  accessProfiles: [],
  securityRules: [
    'As rotas administrativas são protegidas por autenticação JWT.',
    'Usuários administradores acessam dados globais de empresas, obras, projetos e entregas.',
    'Usuários comuns devem permanecer restritos aos dados da própria empresa.',
  ],
});

let adminDataLoaded = false;
let adminDataLoading = false;

const getField = (record, names, fallback = '') => {
  for (const name of names) {
    const value = record?.[name];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
};

const firstLinkedId = (value) => (Array.isArray(value) ? value[0] : value || '');

function replaceArray(target, items) {
  target.splice(0, target.length, ...(items || []));
}

function attachmentFrom(value, fallbackName = 'Anexo') {
  if (Array.isArray(value) && value.length > 0) {
    const file = value[0];
    return {
      name: file.filename || fallbackName,
      href: file.url || '#',
      actionLabel: file.url ? 'Abrir' : 'Visualizar',
    };
  }
  return null;
}

function collectAttachments(record, sourceLabel, clientName = 'MilaTec') {
  const ignoredFields = new Set([
    'id',
    'Empresa',
    'Orçamentos',
    'Projetos',
    'Entregas',
  ]);

  return Object.entries(record || [])
    .filter(([field, value]) => !ignoredFields.has(field) && Array.isArray(value))
    .flatMap(([field, value]) =>
      value
        .filter((item) => item?.url || item?.filename)
        .map((item) => ({
          id: item.id || `${record.id}-${field}`,
          client: clientName,
          name: item.filename || field,
          category: field,
          uploadedAt: 'Disponível',
          visibility: sourceLabel,
          href: item.url || '#',
          actionLabel: item.url ? 'Abrir' : 'Visualizar',
          linkedTypeLabel: sourceLabel,
          linkedRecordName: getField(record, ['Projeto', 'Produto', 'Tipo de serviço', 'Instalação ID', 'Etapa de entrega'], record.id),
        })),
    );
}

//
function adaptAdminPortalData(raw) {
  const companies = raw?.companies || [];
  const users = raw?.users || [];
  const projects = raw?.projects || [];
  const budgets = raw?.budgets || [];
  const deliveries = raw?.deliveries || [];
  const installations = raw?.installations || [];

  const companyById = new Map(companies.map((company) => [company.id, company]));
  const userByCompanyId = new Map();
  users.forEach((user) => {
    const companyId = firstLinkedId(getField(user, ['Empresa'], ''));
    if (companyId && !userByCompanyId.has(companyId)) userByCompanyId.set(companyId, user);
  });

  const budgetById = new Map(budgets.map((budget) => [budget.id, budget]));
  const installationByBudgetId = new Map();
  installations.forEach((installation) => {
    const linkedBudgetIds = getField(installation, ['Orçamentos'], []);
    if (Array.isArray(linkedBudgetIds)) {
      linkedBudgetIds.forEach((budgetId) => installationByBudgetId.set(budgetId, installation));
    }
  });

  const customerRows = companies.map((company) => {
    const contact = userByCompanyId.get(company.id) || {};
    const companyName = getField(company, ['Empresa', 'Nome', 'Name'], 'Empresa não informada');
    const companyBudgets = budgets.filter((budget) => {
      const ids = getField(budget, ['Empresa'], []);
      return Array.isArray(ids) && ids.includes(company.id);
    });
    const companyBudgetIds = companyBudgets.map((budget) => budget.id);
    const companyProjects = projects.filter((project) => {
      const ids = getField(project, ['Orçamentos'], []);
      return Array.isArray(ids) && ids.some((id) => companyBudgetIds.includes(id));
    });
    const companyDeliveries = deliveries.filter((delivery) => {
      const ids = getField(delivery, ['Orçamentos'], []);
      return Array.isArray(ids) && ids.some((id) => companyBudgetIds.includes(id));
    });
    const companyWorks = installations.filter((installation) => {
      const ids = getField(installation, ['Orçamentos'], []);
      return Array.isArray(ids) && ids.some((id) => companyBudgetIds.includes(id));
    });
    const totalValue = companyBudgets.reduce((sum, budget) => sum + Number(getField(budget, ['Valor'], 0) || 0), 0);

    return {
      id: company.id,
      company: companyName,
      cityState: getField(company, ['Estado', 'Cidade', 'Cidade/Estado'], 'Local não informado'),
      primaryContact: getField(contact, ['Nome completo', 'Nome', 'Name'], 'Contato não informado'),
      email: getField(contact, ['E-mail', 'Email'], '-'),
      phone: getField(contact, ['Número de telefone', 'Telefone', 'Phone'], '-'),
      workCount: companyWorks.length,
      projectCount: companyProjects.length,
      deliveryCount: companyDeliveries.length,
      attachmentCount: 0,
      totalProjectValue: formatCurrency(totalValue),
      linkedWorks: [],
      linkedProjects: [],
      linkedDeliveries: [],
      linkedAttachments: [],
    };
  });

  const customerNameByBudgetId = new Map();
  budgets.forEach((budget) => {
    const companyId = firstLinkedId(getField(budget, ['Empresa'], []));
    const company = companyById.get(companyId);
    customerNameByBudgetId.set(budget.id, getField(company, ['Empresa', 'Nome', 'Name'], 'Cliente não informado'));
  });

  const workRows = installations.map((installation) => {
    const linkedBudgetIds = getField(installation, ['Orçamentos'], []);
    const firstBudgetId = Array.isArray(linkedBudgetIds) ? linkedBudgetIds[0] : '';
    const relatedProjects = projects.filter((project) => {
      const ids = getField(project, ['Orçamentos'], []);
      return Array.isArray(ids) && ids.some((id) => linkedBudgetIds.includes(id));
    });
    const relatedDeliveries = deliveries.filter((delivery) => {
      const ids = getField(delivery, ['Orçamentos'], []);
      return Array.isArray(ids) && ids.some((id) => linkedBudgetIds.includes(id));
    });

    return {
      id: installation.id,
      client: customerNameByBudgetId.get(firstBudgetId) || 'Cliente não informado',
      name: getField(installation, ['Tipo de serviço', 'Instalação ID'], 'Obra'),
      city: getField(installation, ['Cidade da obra (from Orçamentos)', 'Cidade da obra'], 'Local não informado'),
      stage: getField(installation, ['Data de fim'], '') ? 'Concluída' : getField(installation, ['Data de início'], '') ? 'Em andamento' : 'Aguardando início',
      quantity: getField(installation, ['Nº dias programados'], '-'),
      value: formatCurrency(getField(installation, ['Valor Total Gasto'], 0)),
      projectCount: relatedProjects.length,
      deliveryCount: relatedDeliveries.length,
      linkedProjects: relatedProjects.map((project) => ({
        id: project.id,
        name: getField(project, ['Projeto'], 'Projeto'),
        product: getField(project, ['Tipo de orçamento'], '-'),
        budgetType: getField(project, ['Tipo de orçamento'], '-'),
        stage: getField(project, ['Etapa do projeto'], '-'),
        quantity: getField(project, ['Peso do projeto (kg)'], '-'),
        registrationAttachment: attachmentFrom(getField(project, ['Registro de obra'], []), 'Registro de obra'),
      })),
      linkedDeliveries: relatedDeliveries.map((delivery) => ({
        id: delivery.id,
        name: getField(delivery, ['Etapa de entrega'], 'Entrega'),
        stage: getField(delivery, ['Etapa de entrega'], '-'),
        quantity: getField(delivery, ['Quantidade'], '-'),
        value: formatCurrency(getField(delivery, ['Valor'], 0)),
        invoiceDate: formatDate(getField(delivery, ['Data de entrega'], '')),
        deliveryAddress: getField(installation, ['Endereço de entrega (from Orçamentos)'], '-'),
        purchaseOrderAttachment: attachmentFrom(getField(delivery, ['Pedido de compra'], []), 'Pedido de compra'),
      })),
    };
  });

  const projectRows = projects.map((project) => {
    const linkedBudgetIds = getField(project, ['Orçamentos'], []);
    const firstBudgetId = Array.isArray(linkedBudgetIds) ? linkedBudgetIds[0] : '';
    const budget = budgetById.get(firstBudgetId) || {};
    const installation = installationByBudgetId.get(firstBudgetId) || {};

    return {
      id: project.id,
      client: customerNameByBudgetId.get(firstBudgetId) || 'Cliente não informado',
      name: getField(project, ['Projeto'], 'Projeto'),
      product: getField(project, ['Tipo de orçamento'], getField(budget, ['Produto'], '-')),
      location: getField(installation, ['Cidade da obra (from Orçamentos)', 'Cidade da obra'], getField(budget, ['Cidade da obra'], '-')),
      type: getField(project, ['Tipo de orçamento'], '-'),
      stage: getField(project, ['Etapa do projeto'], 'Informação em atualização'),
      quantity: getField(project, ['Peso do projeto (kg)'], '-'),
      unitValue: 'A informar',
      totalValue: formatCurrency(getField(budget, ['Valor'], 0)),
      workName: getField(installation, ['Tipo de serviço', 'Instalação ID'], 'Obra não vinculada'),
      workCity: getField(installation, ['Cidade da obra (from Orçamentos)', 'Cidade da obra'], '-'),
      budgetName: getField(budget, ['Produto'], '-'),
      budgetStatus: getField(budget, ['Etapa do negócio'], '-'),
      budgetType: getField(project, ['Tipo de orçamento'], '-'),
      value: formatCurrency(getField(budget, ['Valor'], 0)),
      preProjectAttachment: attachmentFrom(getField(project, ['Pré-projeto'], []), 'Pré-projeto'),
      approvalAttachment: attachmentFrom(getField(project, ['Projeto para aprovação'], []), 'Projeto para aprovação'),
      executiveAttachment: attachmentFrom(getField(project, ['Projeto executivo'], []), 'Projeto executivo'),
      registrationAttachment: attachmentFrom(getField(project, ['Registro de obra'], []), 'Registro de obra'),
    };
  });

  const deliveryRows = deliveries.map((delivery) => {
    const linkedBudgetIds = getField(delivery, ['Orçamentos'], []);
    const firstBudgetId = Array.isArray(linkedBudgetIds) ? linkedBudgetIds[0] : '';
    return {
      id: delivery.id,
      client: customerNameByBudgetId.get(firstBudgetId) || 'Cliente não informado',
      name: getField(delivery, ['Etapa de entrega'], 'Entrega'),
      date: formatDate(getField(delivery, ['Data de entrega'], '')),
      quantity: getField(delivery, ['Quantidade'], '-'),
      status: getField(delivery, ['Etapa de entrega'], 'Programada'),
      tone: getDeliveryTone(getField(delivery, ['Etapa de entrega'], '')),
    };
  });

  const attachmentRows = [
    ...projects.flatMap((record) => collectAttachments(record, 'Projeto')),
    ...deliveries.flatMap((record) => collectAttachments(record, 'Entrega')),
    ...installations.flatMap((record) => collectAttachments(record, 'Obra')),
    ...budgets.flatMap((record) => collectAttachments(record, 'Orçamento')),
  ];

  customerRows.forEach((customer) => {
    customer.linkedWorks = workRows.filter((work) => work.client === customer.company);
    customer.linkedProjects = projectRows.filter((project) => project.client === customer.company);
    customer.linkedDeliveries = deliveryRows.filter((delivery) => delivery.client === customer.company);
    customer.linkedAttachments = attachmentRows.filter((attachment) => attachment.client === customer.company);
    customer.attachmentCount = customer.linkedAttachments.length;
  });

  const accessProfiles = users.map((user) => ({
    id: user.id,
    profile: getField(user, ['role', 'Role', 'Perfil', 'Tipo de acesso', 'Cargo'], 'Usuário'),
    owner: getField(user, ['Nome completo', 'Nome'], 'Usuário'),
    scope: getField(user, ['Empresa'], []).length ? 'Empresa vinculada' : 'Sem empresa vinculada',
    status: 'Ativo',
    tone: 'success',
    reviewedAt: 'Base Airtable',
  }));

  return {
    summaryCards: [
      { label: 'Empresas ativas', value: String(companies.length), detail: 'Empresas cadastradas no Airtable', accent: '#050866' },
      { label: 'Obras monitoradas', value: String(installations.length), detail: 'Instalações/obras acompanhadas', accent: '#004AE8' },
      { label: 'Entregas publicadas', value: String(deliveries.length), detail: 'Entregas registradas', accent: '#00A34A' },
      { label: 'Projetos', value: String(projects.length), detail: 'Projetos vinculados aos orçamentos', accent: '#004AE8' },
    ],
    customers: customerRows,
    works: workRows,
    projects: projectRows,
    deliveries: deliveryRows,
    attachments: attachmentRows,
    accessSummary: [
      { label: 'Usuários', value: String(users.length), detail: 'Contatos cadastrados', accent: '#050866' },
      { label: 'Administradores', value: String(accessProfiles.filter((p) => String(p.profile).toLowerCase().includes('admin')).length), detail: 'Perfis administrativos', accent: '#004AE8' },
      { label: 'Clientes', value: String(users.length), detail: 'Usuários com acesso ao portal', accent: '#00A34A' },
    ],
    accessProfiles,
    securityRules: adminState.securityRules,
  };
}

async function loadAdminPortalData() {
  if (adminDataLoaded || adminDataLoading) return;
  adminDataLoading = true;

  try {
    const dashboard = await getAdminDashboard();
    const data = adaptAdminPortalData(dashboard);

    replaceArray(adminState.summaryCards, data.summaryCards);
    replaceArray(adminState.customers, data.customers);
    replaceArray(adminState.works, data.works);
    replaceArray(adminState.projects, data.projects);
    replaceArray(adminState.deliveries, data.deliveries);
    replaceArray(adminState.attachments, data.attachments);
    replaceArray(adminState.accessSummary, data.accessSummary);
    replaceArray(adminState.accessProfiles, data.accessProfiles);
    replaceArray(adminState.securityRules, data.securityRules);

    adminDataLoaded = true;
  } catch (error) {
    console.error('Erro ao carregar dados administrativos:', error);
  } finally {
    adminDataLoading = false;
  }
}

export function getAdminPortalData() {
  loadAdminPortalData();
  return adminState;
}