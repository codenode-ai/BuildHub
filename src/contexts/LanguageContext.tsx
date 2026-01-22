import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  pt: {
    // Common
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.back': 'Voltar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.actions': 'Ações',
    'common.loading': 'Carregando...',
    'common.noData': 'Nenhum dado encontrado',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sim',
    'common.no': 'Não',
    'common.add': 'Adicionar',
    'common.new': 'Novo',
    'common.view': 'Visualizar',
    'common.close': 'Fechar',
    'common.total': 'Total',
    'common.date': 'Data',
    'common.description': 'Descrição',
    'common.value': 'Valor',
    'common.status': 'Status',
    'common.observations': 'Observações',

    // Auth
    'auth.login': 'Entrar',
    'auth.logout': 'Sair',
    'auth.username': 'Usuário',
    'auth.password': 'Senha',
    'auth.email': 'E-mail',
    'auth.changePassword': 'Alterar senha',
    'auth.newPassword': 'Nova senha',
    'auth.confirmPassword': 'Confirmar senha',
    'auth.register': 'Cadastrar',
    'auth.loginTitle': 'Sistema de Gestão de Obras',
    'auth.loginSubtitle': 'Entre com suas credenciais',
    'auth.noAccount': 'Não tem uma conta?',
    'auth.hasAccount': 'Já tem uma conta?',
    'auth.registerHere': 'Cadastre-se aqui',
    'auth.loginHere': 'Entre aqui',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Obras',
    'nav.clients': 'Clientes',
    'nav.employees': 'Funcionários',
    'nav.materials': 'Materiais',
    'nav.leftovers': 'Sobras',
    'nav.financial': 'Financeiro',

    // Dashboard
    'dashboard.title': 'Minhas obras',
    'dashboard.activeProjects': 'Obras Ativas',
    'dashboard.completedProjects': 'Obras Finalizadas',
    'dashboard.totalProjects': 'Total de Obras',
    'dashboard.newProject': 'Nova Obra',

    // Projects
    'projects.title': 'Obras',
    'projects.new': 'Nova Obra',
    'projects.edit': 'Editar Obra',
    'projects.name': 'Nome da Obra',
    'projects.client': 'Cliente',
    'projects.status': 'Status',
    'projects.startDate': 'Data de Início',
    'projects.endDate': 'Data de Fim',
    'projects.pauseReason': 'Motivo da Paralisação',
    'projects.deleteConfirm': 'Tem certeza que deseja excluir esta obra?',
    'projects.summary': 'Resumo',
    'projects.budget': 'Orçamento',
    'projects.financial': 'Financeiro',
    'projects.team': 'Equipe',
    'projects.history': 'Histórico',
    'projects.budgetedTotal': 'Total Orçado',
    'projects.receivedTotal': 'Total Recebido',
    'projects.costsTotal': 'Total de Materiais',
    'projects.laborTotal': 'Total Mão de Obra',
    'projects.estimatedResult': 'Resultado Estimado',
    'projects.leftoversCredit': 'Créditos de Sobras',
    'projects.budgetTotal': 'Orçamento Total',
    'projects.budgetBalance': 'Saldo do Orçamento',
    'projects.profit': 'Lucro',
    'projects.loss': 'Prejuízo',

    // Project Status
    'status.orcamento': 'Orçamento',
    'status.a_iniciar': 'A Iniciar',
    'status.em_andamento': 'Em Andamento',
    'status.paralisada': 'Paralisada',
    'status.finalizada': 'Finalizada',

    // Clients
    'clients.title': 'Clientes',
    'clients.new': 'Novo Cliente',
    'clients.edit': 'Editar Cliente',
    'clients.name': 'Nome',
    'clients.phone': 'Telefone',
    'clients.email': 'E-mail',
    'clients.address': 'Endereço',
    'clients.projects': 'Obras do Cliente',
    'clients.newProject': 'Nova Obra para este Cliente',
    'clients.deleteConfirm': 'Tem certeza que deseja excluir este cliente?',

    // Budget
    'budget.title': 'Orçamento',
    'budget.new': 'Novo Orçamento',
    'budget.items': 'Itens do Orçamento',
    'budget.newItem': 'Novo Item',
    'budget.editItem': 'Editar Item',
    'budget.quantity': 'Quantidade',
    'budget.unitPrice': 'Valor Unitário',
    'budget.subtotal': 'Subtotal',
    'budget.total': 'Total do Orçamento',
    'budget.status': 'Status',
    'budget.inReview': 'Em Revisão',
    'budget.approved': 'Aprovado',
    'budget.deleteItemConfirm': 'Tem certeza que deseja excluir este item?',

    // Financial
    'financial.title': 'Financeiro',
    'financial.revenues': 'Receitas',
    'financial.costs': 'Custos',
    'financial.newRevenue': 'Nova Receita',
    'financial.newCost': 'Novo Custo',
    'financial.editRevenue': 'Editar Receita',
    'financial.editCost': 'Editar Custo',
    'financial.paymentMethod': 'Forma de Pagamento',
    'financial.costType': 'Tipo de Custo',
    'financial.labor': 'Mão de Obra',
    'financial.materials': 'Material / Outros',
    'financial.deleteRevenueConfirm': 'Tem certeza que deseja excluir esta receita?',
    'financial.deleteCostConfirm': 'Tem certeza que deseja excluir este custo?',
    'financial.dashboard': 'Dashboard Financeiro',
    'financial.period': 'Período',
    'financial.totalRevenue': 'Faturamento Total',
    'financial.totalCosts': 'Total de Custos',
    'financial.result': 'Resultado',
    'financial.completedProjects': 'Obras Finalizadas no Período',
    'financial.leftoversCredit': 'Créditos de Sobras',
    'financial.materialsHint': 'Registre materiais aqui; mão de obra fica na aba Equipe.',
    'financial.materialsUsage': 'Materiais (Uso)',
    'financial.laborAllocations': 'Alocações de Mão de Obra',

    // Employees
    'employees.title': 'Funcionários',
    'employees.new': 'Novo Funcionário',
    'employees.edit': 'Editar Funcionário',
    'employees.name': 'Nome',
    'employees.chargeType': 'Tipo de Cobrança',
    'employees.hourly': 'Por Hora',
    'employees.daily': 'Por Dia',
    'employees.rate': 'Valor',
    'employees.phone': 'Telefone',
    'employees.deleteConfirm': 'Tem certeza que deseja excluir este funcionário?',

    // Materials
    'materials.title': 'Materiais',
    'materials.new': 'Novo Material',
    'materials.name': 'Nome do Material',
    'materials.unit': 'Unidade',
    'materials.referencePrice': 'Preço de Referência',
    'materials.deleteConfirm': 'Tem certeza que deseja excluir este material?',

    // Allocations
    'allocations.title': 'Alocações Diárias',
    'allocations.new': 'Nova Alocação',
    'allocations.hours': 'Horas',
    'allocations.note': 'Observação do Dia',
    // Leftovers
    'leftovers.title': 'Sobras de Materiais',
    'leftovers.new': 'Nova Sobra',
    'leftovers.apply': 'Aplicar',
    'leftovers.available': 'Disponível',
    'leftovers.totalValue': 'Valor Total',
    'leftovers.balanceValue': 'Saldo de Valor',
    'leftovers.originWork': 'Obra de Origem',
    'leftovers.destinationWork': 'Obra de Destino',
    'leftovers.unit': 'Unidade',
    'leftovers.quantity': 'Quantidade',
    'leftovers.creditValue': 'Valor do Crédito',
    'leftovers.date': 'Data',
    'leftovers.deleteConfirm': 'Tem certeza que deseja excluir esta sobra?',
    'leftovers.noData': 'Nenhuma sobra registrada',
    'leftovers.exceedQuantity': 'Quantidade maior que o saldo disponível.',
    'leftovers.exceedValue': 'Valor do crédito maior que o saldo disponível.',

    // Team
    'team.title': 'Equipe da Obra',
    'team.addEmployee': 'Adicionar Funcionário',
    'team.removeConfirm': 'Tem certeza que deseja remover este funcionário da equipe?',
    'team.laborEntries': 'Lançamentos de Mão de Obra',
    'team.newEntry': 'Novo Lançamento',
    'team.editEntry': 'Editar Lançamento',
    'team.employee': 'Funcionário',
    'team.quantity': 'Quantidade',
    'team.hours': 'Horas',
    'team.days': 'Dias',
    'team.totalHours': 'Total de Horas',
    'team.totalDays': 'Total de Dias',
    'team.totalCost': 'Custo Total',
    'team.deleteEntryConfirm': 'Tem certeza que deseja excluir este lançamento?',

    // Messages
    'messages.success': 'Operação realizada com sucesso!',
    'messages.error': 'Ocorreu um erro. Tente novamente.',
    'messages.deleteSuccess': 'Registro excluído com sucesso!',
    'messages.saveSuccess': 'Registro salvo com sucesso!',
    'messages.loginError': 'Usuário ou senha incorretos',
    'messages.registerSuccess': 'Cadastro realizado com sucesso!',
    'messages.required': 'Campo obrigatório',
    'messages.passwordMismatch': 'As senhas não conferem',
    'messages.passwordUpdated': 'Senha atualizada com sucesso!',
  },
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.back': 'Back',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.actions': 'Actions',
    'common.loading': 'Loading...',
    'common.noData': 'No data found',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.add': 'Add',
    'common.new': 'New',
    'common.view': 'View',
    'common.close': 'Close',
    'common.total': 'Total',
    'common.date': 'Date',
    'common.description': 'Description',
    'common.value': 'Value',
    'common.status': 'Status',
    'common.observations': 'Observations',

    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.username': 'Username',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.changePassword': 'Change password',
    'auth.newPassword': 'New password',
    'auth.confirmPassword': 'Confirm password',
    'auth.register': 'Register',
    'auth.loginTitle': 'Construction Management System',
    'auth.loginSubtitle': 'Enter your credentials',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.registerHere': 'Register here',
    'auth.loginHere': 'Login here',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Projects',
    'nav.clients': 'Clients',
    'nav.employees': 'Employees',
    'nav.materials': 'Materials',
    'nav.leftovers': 'Leftovers',
    'nav.financial': 'Financial',

    // Dashboard
    'dashboard.title': 'Projects Dashboard',
    'dashboard.activeProjects': 'Active Projects',
    'dashboard.completedProjects': 'Completed Projects',
    'dashboard.totalProjects': 'Total Projects',
    'dashboard.newProject': 'New Project',

    // Projects
    'projects.title': 'Projects',
    'projects.new': 'New Project',
    'projects.edit': 'Edit Project',
    'projects.name': 'Project Name',
    'projects.client': 'Client',
    'projects.status': 'Status',
    'projects.startDate': 'Start Date',
    'projects.endDate': 'End Date',
    'projects.pauseReason': 'Pause Reason',
    'projects.deleteConfirm': 'Are you sure you want to delete this project?',
    'projects.summary': 'Summary',
    'projects.budget': 'Budget',
    'projects.financial': 'Financial',
    'projects.team': 'Team',
    'projects.history': 'History',
    'projects.budgetedTotal': 'Budgeted Total',
    'projects.receivedTotal': 'Total Received',
    'projects.costsTotal': 'Total Materials',
    'projects.laborTotal': 'Total Labor',
    'projects.estimatedResult': 'Estimated Result',
    'projects.leftoversCredit': 'Leftovers Credits',
    'projects.budgetTotal': 'Total Budget',
    'projects.budgetBalance': 'Budget Balance',
    'projects.profit': 'Profit',
    'projects.loss': 'Loss',

    // Project Status
    'status.orcamento': 'Budget',
    'status.a_iniciar': 'To Start',
    'status.em_andamento': 'In Progress',
    'status.paralisada': 'Paused',
    'status.finalizada': 'Completed',

    // Clients
    'clients.title': 'Clients',
    'clients.new': 'New Client',
    'clients.edit': 'Edit Client',
    'clients.name': 'Name',
    'clients.phone': 'Phone',
    'clients.email': 'Email',
    'clients.address': 'Address',
    'clients.projects': 'Client Projects',
    'clients.newProject': 'New Project for this Client',
    'clients.deleteConfirm': 'Are you sure you want to delete this client?',

    // Budget
    'budget.title': 'Budget',
    'budget.new': 'New Budget',
    'budget.items': 'Budget Items',
    'budget.newItem': 'New Item',
    'budget.editItem': 'Edit Item',
    'budget.quantity': 'Quantity',
    'budget.unitPrice': 'Unit Price',
    'budget.subtotal': 'Subtotal',
    'budget.total': 'Budget Total',
    'budget.status': 'Status',
    'budget.inReview': 'In Review',
    'budget.approved': 'Approved',
    'budget.deleteItemConfirm': 'Are you sure you want to delete this item?',

    // Financial
    'financial.title': 'Financial',
    'financial.revenues': 'Revenues',
    'financial.costs': 'Costs',
    'financial.newRevenue': 'New Revenue',
    'financial.newCost': 'New Cost',
    'financial.editRevenue': 'Edit Revenue',
    'financial.editCost': 'Edit Cost',
    'financial.paymentMethod': 'Payment Method',
    'financial.costType': 'Cost Type',
    'financial.labor': 'Labor',
    'financial.materials': 'Materials / Others',
    'financial.deleteRevenueConfirm': 'Are you sure you want to delete this revenue?',
    'financial.deleteCostConfirm': 'Are you sure you want to delete this cost?',
    'financial.dashboard': 'Financial Dashboard',
    'financial.period': 'Period',
    'financial.totalRevenue': 'Total Revenue',
    'financial.totalCosts': 'Total Costs',
    'financial.result': 'Result',
    'financial.completedProjects': 'Projects Completed in Period',
    'financial.leftoversCredit': 'Leftovers Credits',
    'financial.materialsHint': 'Record materials here; labor is tracked in the Team tab.',
    'financial.materialsUsage': 'Materials (Usage)',
    'financial.laborAllocations': 'Labor Allocations',

    // Employees
    'employees.title': 'Employees',
    'employees.new': 'New Employee',
    'employees.edit': 'Edit Employee',
    'employees.name': 'Name',
    'employees.chargeType': 'Charge Type',
    'employees.hourly': 'Hourly',
    'employees.daily': 'Daily',
    'employees.rate': 'Rate',
    'employees.phone': 'Phone',
    'employees.deleteConfirm': 'Are you sure you want to delete this employee?',

    // Materials
    'materials.title': 'Materials',
    'materials.new': 'New Material',
    'materials.name': 'Material Name',
    'materials.unit': 'Unit',
    'materials.referencePrice': 'Reference Price',
    'materials.deleteConfirm': 'Are you sure you want to delete this material?',

    // Allocations
    'allocations.title': 'Daily Allocations',
    'allocations.new': 'New Allocation',
    'allocations.hours': 'Hours',
    'allocations.note': 'Daily Note',

    // Leftovers
    'leftovers.title': 'Material Leftovers',
    'leftovers.new': 'New Leftover',
    'leftovers.apply': 'Apply',
    'leftovers.available': 'Available',
    'leftovers.totalValue': 'Total Value',
    'leftovers.balanceValue': 'Balance Value',
    'leftovers.originWork': 'Origin Project',
    'leftovers.destinationWork': 'Destination Project',
    'leftovers.unit': 'Unit',
    'leftovers.quantity': 'Quantity',
    'leftovers.creditValue': 'Credit Value',
    'leftovers.date': 'Date',
    'leftovers.deleteConfirm': 'Are you sure you want to delete this leftover?',
    'leftovers.noData': 'No leftovers found',
    'leftovers.exceedQuantity': 'Quantity is greater than available balance.',
    'leftovers.exceedValue': 'Credit value is greater than available balance.',

    // Team
    'team.title': 'Project Team',
    'team.addEmployee': 'Add Employee',
    'team.removeConfirm': 'Are you sure you want to remove this employee from the team?',
    'team.laborEntries': 'Labor Entries',
    'team.newEntry': 'New Entry',
    'team.editEntry': 'Edit Entry',
    'team.employee': 'Employee',
    'team.quantity': 'Quantity',
    'team.hours': 'Hours',
    'team.days': 'Days',
    'team.totalHours': 'Total Hours',
    'team.totalDays': 'Total Days',
    'team.totalCost': 'Total Cost',
    'team.deleteEntryConfirm': 'Are you sure you want to delete this entry?',

    // Messages
    'messages.success': 'Operation completed successfully!',
    'messages.error': 'An error occurred. Please try again.',
    'messages.deleteSuccess': 'Record deleted successfully!',
    'messages.saveSuccess': 'Record saved successfully!',
    'messages.loginError': 'Invalid username or password',
    'messages.registerSuccess': 'Registration completed successfully!',
    'messages.required': 'Required field',
    'messages.passwordMismatch': 'Passwords do not match',
    'messages.passwordUpdated': 'Password updated successfully!',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.pt] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
