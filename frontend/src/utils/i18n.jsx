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

    // Dashboard extras
    'dashboard.copy_portal': 'Copy to Jawda Portal',
    'dashboard.copy_portal_sub': 'Numerator & denominator values ready to enter at bpmweb.doh.gov.ae',
    'dashboard.submission_status': 'Submission Status',
    'dashboard.quarter_comparison': 'Quarter Comparison',
    'dashboard.data_quality': 'Data Quality & Readiness',
    'dashboard.column_mapping': 'Column Mapping',
    'dashboard.merge_report': 'Data Merge Report',
    'dashboard.compliance_calendar': 'Compliance Calendar',
    'dashboard.no_kpi_data': 'No KPI Data Yet',
    'dashboard.upload_cta': 'Upload your clinic data files to see your Jawda KPI results here.',
    'dashboard.upload_data': 'Upload Data',
    'dashboard.what_youll_see': "What You'll See After Uploading",
    'dashboard.kpi_results_label': 'KPI Results',
    'dashboard.action_plan_label': 'Action Plan',
    'dashboard.data_quality_label': 'Data Quality',
    'dashboard.doh_export': 'DOH Export',
    'dashboard.steps_to_fix': 'Steps to fix gaps',
    'dashboard.completeness': 'Completeness check',
    'dashboard.portal_ready': 'Jawda portal ready',
    'dashboard.powered_by': 'Powered by TriZodiac',

    // KPI names
    'kpi.OMC001': 'Asthma Medication Ratio',
    'kpi.OMC002': 'Avoidance of Antibiotics',
    'kpi.OMC003': 'Time to See Physician',
    'kpi.OMC004': 'BMI Assessment & Counselling',
    'kpi.OMC005': 'Diabetes HbA1c Control',
    'kpi.OMC006': 'Controlling High BP',
    'kpi.OMC007': 'Opioid Use Risk',
    'kpi.OMC008': 'Kidney Disease Eval',

    // Explorer
    'explorer.title': 'KPI Explorer',
    'explorer.all': 'All KPIs',
    'explorer.filter_passing': 'Passing',
    'explorer.filter_failing': 'Below Target',
    'explorer.filter_na': 'N/A',

    // Detail page
    'detail.trend': 'Trend Across Quarters',
    'detail.whatif': 'What-If Simulator',
    'detail.definition': 'DOH V2 2026 Definition',
    'detail.how_to_improve': 'How to Improve',
    'detail.missing_fields': 'Missing Data Fields',
    'detail.calc_notes': 'Calculation Notes',
    'detail.benchmark': 'Clinic Benchmarking',
    'detail.patient_cohort': 'Patient Cohort',
    'detail.export_csv': 'Export CSV',
    'detail.target': 'Target',
    'detail.population': 'Eligible Population',
    'detail.direction': 'Direction',
    'detail.data_required': 'Data Required',
    'detail.numerator': 'Numerator',
    'detail.denominator': 'Denominator',
    'detail.result': 'Result',
    'detail.rank': 'Rank',
    'detail.percentile': 'Percentile',
    'detail.avg_clinics': 'Avg All Clinics',
    'detail.clinics': 'Clinics',

    // Users
    'users.title': 'Users',
    'users.subtitle': 'Manage team members and their roles',
    'users.add': 'Add User',
    'users.name': 'Full Name',
    'users.email': 'Email',
    'users.role': 'Role',
    'users.last_login': 'Last Login',
    'users.never': 'Never',
    'users.delete_confirm': 'Delete user',
    'users.clinic_admin': 'Clinic Admin',
    'users.quality_officer': 'Quality Officer',
    'users.viewer': 'Viewer',

    // Audit
    'audit.title': 'Audit Trail',

    // Login
    'login.title': 'Sign In',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Sign In',
    'login.signing_in': 'Signing in...',

    // Misc
    'misc.adhics': 'ADHICS Compliant',
    'misc.doh_v2': 'DOH V2 2026',
    'misc.uae_north': 'UAE North',
    'misc.overdue': 'overdue',
    'misc.soon': 'soon',
    'misc.no_data': 'No data',
    'misc.pending': 'Pending',
    'misc.due': 'Due',
    'misc.copy_all': 'Copy All',
    'misc.copied': 'Copied!',
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

    // Dashboard extras
    'dashboard.copy_portal': 'نسخ لبوابة جودة',
    'dashboard.copy_portal_sub': 'قيم البسط والمقام جاهزة للإدخال في bpmweb.doh.gov.ae',
    'dashboard.submission_status': 'حالة التقديم',
    'dashboard.quarter_comparison': 'مقارنة الأرباع',
    'dashboard.data_quality': 'جودة البيانات والجاهزية',
    'dashboard.column_mapping': 'تعيين الأعمدة',
    'dashboard.merge_report': 'تقرير دمج البيانات',
    'dashboard.compliance_calendar': 'تقويم الامتثال',
    'dashboard.no_kpi_data': 'لا توجد بيانات مؤشرات بعد',
    'dashboard.upload_cta': 'ارفع ملفات بيانات عيادتك لعرض نتائج مؤشرات جودة هنا.',
    'dashboard.upload_data': 'رفع البيانات',
    'dashboard.what_youll_see': 'ما ستراه بعد الرفع',
    'dashboard.kpi_results_label': 'نتائج المؤشرات',
    'dashboard.action_plan_label': 'خطة العمل',
    'dashboard.data_quality_label': 'جودة البيانات',
    'dashboard.doh_export': 'تصدير لدائرة الصحة',
    'dashboard.steps_to_fix': 'خطوات لإصلاح الفجوات',
    'dashboard.completeness': 'فحص الاكتمال',
    'dashboard.portal_ready': 'جاهز لبوابة جودة',
    'dashboard.powered_by': 'بواسطة ترايزودياك',

    // KPI names
    'kpi.OMC001': 'نسبة أدوية الربو',
    'kpi.OMC002': 'تجنب المضادات الحيوية',
    'kpi.OMC003': 'وقت مقابلة الطبيب',
    'kpi.OMC004': 'تقييم مؤشر كتلة الجسم',
    'kpi.OMC005': 'التحكم بسكر الدم HbA1c',
    'kpi.OMC006': 'التحكم بضغط الدم المرتفع',
    'kpi.OMC007': 'خطر استخدام الأفيونات',
    'kpi.OMC008': 'تقييم أمراض الكلى',

    // Explorer
    'explorer.title': 'مستكشف المؤشرات',
    'explorer.all': 'جميع المؤشرات',
    'explorer.filter_passing': 'ناجح',
    'explorer.filter_failing': 'أقل من الهدف',
    'explorer.filter_na': 'غير قابل للتطبيق',

    // Detail page
    'detail.trend': 'الاتجاه عبر الأرباع',
    'detail.whatif': 'محاكي ماذا لو',
    'detail.definition': 'تعريف دائرة الصحة V2 2026',
    'detail.how_to_improve': 'كيفية التحسين',
    'detail.missing_fields': 'حقول بيانات مفقودة',
    'detail.calc_notes': 'ملاحظات الحساب',
    'detail.benchmark': 'مقارنة العيادات',
    'detail.patient_cohort': 'مجموعة المرضى',
    'detail.export_csv': 'تصدير CSV',
    'detail.target': 'الهدف',
    'detail.population': 'السكان المؤهلون',
    'detail.direction': 'الاتجاه',
    'detail.data_required': 'البيانات المطلوبة',
    'detail.numerator': 'البسط',
    'detail.denominator': 'المقام',
    'detail.result': 'النتيجة',
    'detail.rank': 'الترتيب',
    'detail.percentile': 'المئوية',
    'detail.avg_clinics': 'متوسط جميع العيادات',
    'detail.clinics': 'العيادات',

    // Users
    'users.title': 'المستخدمون',
    'users.subtitle': 'إدارة أعضاء الفريق وأدوارهم',
    'users.add': 'إضافة مستخدم',
    'users.name': 'الاسم الكامل',
    'users.email': 'البريد الإلكتروني',
    'users.role': 'الدور',
    'users.last_login': 'آخر دخول',
    'users.never': 'لم يسجل بعد',
    'users.delete_confirm': 'حذف المستخدم',
    'users.clinic_admin': 'مدير العيادة',
    'users.quality_officer': 'مسؤول الجودة',
    'users.viewer': 'مشاهد',

    // Audit
    'audit.title': 'سجل المراجعة',

    // Login
    'login.title': 'تسجيل الدخول',
    'login.email': 'البريد الإلكتروني',
    'login.password': 'كلمة المرور',
    'login.submit': 'دخول',
    'login.signing_in': 'جاري الدخول...',

    // Misc
    'misc.adhics': 'متوافق مع ADHICS',
    'misc.doh_v2': 'دائرة الصحة V2 2026',
    'misc.uae_north': 'الإمارات الشمالية',
    'misc.overdue': 'متأخر',
    'misc.soon': 'قريباً',
    'misc.no_data': 'لا توجد بيانات',
    'misc.pending': 'معلق',
    'misc.due': 'مستحق',
    'misc.copy_all': 'نسخ الكل',
    'misc.copied': 'تم النسخ!',
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
