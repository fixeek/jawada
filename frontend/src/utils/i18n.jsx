/**
 * Lightweight i18n — Arabic/English language support.
 * No heavy library — just a context + JSON translations.
 */
import { createContext, useContext, useState, useEffect } from 'react'

const LANG_KEY = 'jawda_lang'

const translations = {
  en: {
    // Navigation
    'nav.overview': 'Overview',
    'nav.dashboard': 'Dashboard',
    'nav.upload': 'Upload & Calculate',
    'nav.kpi_explorer': 'KPI Explorer',
    'nav.submissions': 'Submissions',
    'nav.reports': 'Reports',
    'nav.audit': 'Audit Trail',
    'nav.users': 'Users',
    'nav.settings': 'Settings',
    'nav.section.overview': 'Overview',
    'nav.section.data': 'Data',
    'nav.section.compliance': 'Compliance',
    'nav.section.admin': 'Admin',
    'nav.section.platform': 'Platform',
    'nav.logout': 'Logout',
    'nav.collapse': 'Collapse',

    // Dashboard
    'dashboard.title': 'KPI Dashboard',
    'dashboard.quarters': 'Quarters',
    'dashboard.last_upload': 'Last Upload',
    'dashboard.overall_trend': 'Overall Trend',
    'dashboard.improving': 'Improving',
    'dashboard.declining': 'Declining',
    'dashboard.stable': 'Stable',
    'dashboard.next_deadline': 'Next Deadline',
    'dashboard.days_left': 'd left',
    'dashboard.viewing': 'Viewing',
    'dashboard.back_to_latest': 'Back to latest',
    'dashboard.kpi_results': 'KPI Results',
    'dashboard.kpi_trends': 'KPI Trends',
    'dashboard.action_plan': 'Action Plan to Pass Jawda',
    'dashboard.action_required': 'actions required',
    'dashboard.action_not_applicable': 'Action Plan Not Applicable',
    'dashboard.past_quarter_note': 'is a past quarter. Action plans are only shown for the latest quarter since historical submissions cannot be amended after DOH deadline.',

    // KPI statuses
    'kpi.meeting_target': 'Meeting Target',
    'kpi.below_target': 'Below Target',
    'kpi.not_applicable': 'Not Applicable',
    'kpi.proxy_data': 'Proxy Data',
    'kpi.insufficient_data': 'Insufficient Data',
    'kpi.no_eligible': 'N/A — No eligible patients',
    'kpi.pass': 'PASS',
    'kpi.fail': 'FAIL',
    'kpi.higher_better': 'Higher is better',
    'kpi.lower_better': 'Lower is better',

    // Verdict
    'verdict.ready': 'Ready for Jawda Submission',
    'verdict.attention': 'KPIs need attention',
    'verdict.not_ready': 'Not ready for Jawda submission',
    'verdict.passing': 'passing',
    'verdict.below': 'below target',
    'verdict.na': 'not applicable',
    'verdict.insufficient': 'insufficient data',
    'verdict.of_8': 'of 8 KPIs passing',

    // Upload
    'upload.title': 'Upload & Calculate',
    'upload.current_quarter': 'Current Quarter',
    'upload.historical': 'Historical Quarter',
    'upload.select_quarter': 'Select quarter...',
    'upload.upload_files': 'Upload Data Files',
    'upload.kpi_required': 'KPI Data is required. Other files add more KPI coverage.',
    'upload.validate': 'Upload & Validate',
    'upload.validating': 'Validating files...',
    'upload.calculate': 'Calculate KPIs',
    'upload.calculating': 'Calculating',
    'upload.template': 'Download blank template',
    'upload.quarters_on_file': 'Quarters on File',
    'upload.getting_started': 'Getting Started',

    // Reports
    'reports.title': 'Reports',
    'reports.subtitle': 'Generate branded PDF reports for management and DOH auditors',
    'reports.download': 'Download PDF',
    'reports.generating': 'Generating...',
    'reports.email': 'Email',
    'reports.whats_in': "What's in the report?",

    // Submissions
    'submissions.title': 'Submissions',
    'submissions.subtitle': 'Track DOH Jawda submission status per quarter',
    'submissions.mark_as': 'Mark as',
    'submissions.doh_portal': 'DOH Portal',
    'submissions.calculated': 'Calculated',
    'submissions.under_review': 'Under Review',
    'submissions.approved': 'Approved',
    'submissions.submitted': 'Submitted to DOH',
    'submissions.accepted': 'Accepted',

    // Settings
    'settings.title': 'Settings',
    'settings.account': 'Your Account',
    'settings.change_password': 'Change Password',
    'settings.new_password': 'New Password',
    'settings.confirm_password': 'Confirm Password',
    'settings.save': 'Change Password',
    'settings.language': 'Language',

    // Common
    'common.loading': 'Loading...',
    'common.no_data': 'No data yet',
    'common.records': 'records',
    'common.patients': 'patients',
    'common.passing': 'passing',
    'common.print': 'Print',
    'common.csv': 'CSV',
    'common.pdf_report': 'PDF Report',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.done': 'Done',
    'common.today': 'Today',
    'common.yesterday': 'Yesterday',
    'common.ago': 'ago',

    // Smart Recommendations
    'recs.title': 'Smart Recommendations',
    'recs.high_priority': 'high priority',
    'recs.patients_to_act': 'patients to act on',
    'recs.recommended_action': 'Recommended Action',

    // Predictions
    'pred.at_risk': 'at risk — declining trend',
    'pred.trending_pass': 'trending toward PASS',
    'pred.prediction': 'PREDICTION',
  },

  ar: {
    // Navigation
    'nav.overview': 'نظرة عامة',
    'nav.dashboard': 'لوحة المعلومات',
    'nav.upload': 'رفع وحساب',
    'nav.kpi_explorer': 'مستكشف المؤشرات',
    'nav.submissions': 'التقديمات',
    'nav.reports': 'التقارير',
    'nav.audit': 'سجل المراجعة',
    'nav.users': 'المستخدمون',
    'nav.settings': 'الإعدادات',
    'nav.section.overview': 'نظرة عامة',
    'nav.section.data': 'البيانات',
    'nav.section.compliance': 'الامتثال',
    'nav.section.admin': 'الإدارة',
    'nav.section.platform': 'المنصة',
    'nav.logout': 'تسجيل الخروج',
    'nav.collapse': 'طي',

    // Dashboard
    'dashboard.title': 'لوحة مؤشرات الأداء',
    'dashboard.quarters': 'الأرباع',
    'dashboard.last_upload': 'آخر رفع',
    'dashboard.overall_trend': 'الاتجاه العام',
    'dashboard.improving': 'تحسّن',
    'dashboard.declining': 'تراجع',
    'dashboard.stable': 'مستقر',
    'dashboard.next_deadline': 'الموعد القادم',
    'dashboard.days_left': 'يوم متبقي',
    'dashboard.viewing': 'عرض',
    'dashboard.back_to_latest': 'العودة للأحدث',
    'dashboard.kpi_results': 'نتائج المؤشرات',
    'dashboard.kpi_trends': 'اتجاهات المؤشرات',
    'dashboard.action_plan': 'خطة العمل لاجتياز جودة',
    'dashboard.action_required': 'إجراءات مطلوبة',
    'dashboard.action_not_applicable': 'خطة العمل غير قابلة للتطبيق',
    'dashboard.past_quarter_note': 'ربع سابق. تُعرض خطط العمل فقط لأحدث ربع لأنه لا يمكن تعديل التقديمات التاريخية بعد الموعد النهائي.',

    // KPI statuses
    'kpi.meeting_target': 'يحقق الهدف',
    'kpi.below_target': 'أقل من الهدف',
    'kpi.not_applicable': 'غير قابل للتطبيق',
    'kpi.proxy_data': 'بيانات تقريبية',
    'kpi.insufficient_data': 'بيانات غير كافية',
    'kpi.no_eligible': 'غ/م — لا يوجد مرضى مؤهلون',
    'kpi.pass': 'ناجح',
    'kpi.fail': 'غير ناجح',
    'kpi.higher_better': 'الأعلى أفضل',
    'kpi.lower_better': 'الأقل أفضل',

    // Verdict
    'verdict.ready': 'جاهز لتقديم جودة',
    'verdict.attention': 'مؤشرات تحتاج اهتمام',
    'verdict.not_ready': 'غير جاهز لتقديم جودة',
    'verdict.passing': 'ناجح',
    'verdict.below': 'أقل من الهدف',
    'verdict.na': 'غير قابل للتطبيق',
    'verdict.insufficient': 'بيانات غير كافية',
    'verdict.of_8': 'من 8 مؤشرات ناجحة',

    // Upload
    'upload.title': 'رفع وحساب',
    'upload.current_quarter': 'الربع الحالي',
    'upload.historical': 'ربع تاريخي',
    'upload.select_quarter': 'اختر الربع...',
    'upload.upload_files': 'رفع ملفات البيانات',
    'upload.kpi_required': 'ملف بيانات المؤشرات مطلوب. الملفات الأخرى تزيد تغطية المؤشرات.',
    'upload.validate': 'رفع والتحقق',
    'upload.validating': 'جاري التحقق...',
    'upload.calculate': 'حساب المؤشرات',
    'upload.calculating': 'جاري الحساب',
    'upload.template': 'تحميل القالب الفارغ',
    'upload.quarters_on_file': 'الأرباع المحفوظة',
    'upload.getting_started': 'البدء',

    // Reports
    'reports.title': 'التقارير',
    'reports.subtitle': 'إنشاء تقارير PDF للإدارة ومدققي دائرة الصحة',
    'reports.download': 'تحميل PDF',
    'reports.generating': 'جاري الإنشاء...',
    'reports.email': 'بريد إلكتروني',
    'reports.whats_in': 'ماذا يتضمن التقرير؟',

    // Submissions
    'submissions.title': 'التقديمات',
    'submissions.subtitle': 'تتبع حالة تقديم جودة لدائرة الصحة',
    'submissions.mark_as': 'تحديد كـ',
    'submissions.doh_portal': 'بوابة دائرة الصحة',
    'submissions.calculated': 'تم الحساب',
    'submissions.under_review': 'قيد المراجعة',
    'submissions.approved': 'معتمد',
    'submissions.submitted': 'مقدم لدائرة الصحة',
    'submissions.accepted': 'مقبول',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.account': 'حسابك',
    'settings.change_password': 'تغيير كلمة المرور',
    'settings.new_password': 'كلمة المرور الجديدة',
    'settings.confirm_password': 'تأكيد كلمة المرور',
    'settings.save': 'تغيير كلمة المرور',
    'settings.language': 'اللغة',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.no_data': 'لا توجد بيانات بعد',
    'common.records': 'سجلات',
    'common.patients': 'مرضى',
    'common.passing': 'ناجح',
    'common.print': 'طباعة',
    'common.csv': 'CSV',
    'common.pdf_report': 'تقرير PDF',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.done': 'تم',
    'common.today': 'اليوم',
    'common.yesterday': 'أمس',
    'common.ago': 'مضت',

    // Smart Recommendations
    'recs.title': 'توصيات ذكية',
    'recs.high_priority': 'أولوية عالية',
    'recs.patients_to_act': 'مرضى يحتاجون إجراء',
    'recs.recommended_action': 'الإجراء الموصى به',

    // Predictions
    'pred.at_risk': 'معرّض للخطر — اتجاه تنازلي',
    'pred.trending_pass': 'يتجه نحو النجاح',
    'pred.prediction': 'تنبؤ',
  },
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'en')

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  function t(key, fallback) {
    return translations[lang]?.[key] || translations.en?.[key] || fallback || key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg
        bg-white/10 hover:bg-white/20 text-navy-200 hover:text-white transition-all"
      title={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
    >
      <span className="text-sm">{lang === 'en' ? '🇦🇪' : '🇬🇧'}</span>
      <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
    </button>
  )
}
