// ============ Med Hours v1.1 - التطبيق الرئيسي ============

class MedHoursApp {
    constructor() {
        // حالة التطبيق
        this.medications = [];
        this.doseHistory = [];
        this.settings = {
            theme: 'light',
            language: 'ar',
            primaryColor: '#2196F3',
            notificationsEnabled: false
        };
        
        // المراقبون
        this.timers = new Map();
        this.notificationTimers = new Map();
        
        // عناصر واجهة المستخدم
        this.elements = {};
        
        // تهيئة التطبيق
        this.init();
    }
    
    // ============ التهيئة ============
    async init() {
        this.cacheElements();
        this.loadData();
        this.setupEventListeners();
        this.showSplashScreen();
        await this.requestNotificationPermission();
        this.registerServiceWorker();
        this.handleInstallPrompt();
        this.updateUI();
        this.startAllTimers();
    }
    
    // ============ تخزين العناصر ============
    cacheElements() {
        this.elements = {
            splashScreen: document.getElementById('splashScreen'),
            app: document.getElementById('app'),
            medicationsList: document.getElementById('medicationsList'),
            doseHistory: document.getElementById('doseHistory'),
            activeMeds: document.getElementById('activeMeds'),
            todayDoses: document.getElementById('todayDoses'),
            nextDose: document.getElementById('nextDose'),
            modalTitle: document.getElementById('modalTitle'),
            medicationForm: document.getElementById('medicationForm'),
            medName: document.getElementById('medName'),
            doseInterval: document.getElementById('doseInterval'),
            lastDose: document.getElementById('lastDose'),
            medicationModal: document.getElementById('medicationModal'),
            confirmModal: document.getElementById('confirmModal'),
            confirmMessage: document.getElementById('confirmMessage'),
            confirmYes: document.getElementById('confirmYes'),
            confirmNo: document.getElementById('confirmNo'),
            aboutModal: document.getElementById('aboutModal'),
            settingsModal: document.getElementById('settingsModal'),
            installBtn: document.getElementById('installBtn'),
            themeToggle: document.getElementById('themeToggle'),
            langToggle: document.getElementById('langToggle'),
            notificationSound: document.getElementById('notificationSound'),
            themeColorMeta: document.getElementById('theme-color-meta')
        };
    }
    
    // ============ تحميل البيانات ============
    loadData() {
        try {
            const savedMeds = localStorage.getItem('medHours_medications');
            const savedHistory = localStorage.getItem('medHours_history');
            const savedSettings = localStorage.getItem('medHours_settings');
            
            if (savedMeds) this.medications = JSON.parse(savedMeds);
            if (savedHistory) this.doseHistory = JSON.parse(savedHistory);
            if (savedSettings) this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            
            this.applySettings();
        } catch (error) {
            console.error('Error loading data:', error);
            this.medications = [];
            this.doseHistory = [];
        }
    }
    
    // ============ حفظ البيانات ============
    saveData() {
        try {
            localStorage.setItem('medHours_medications', JSON.stringify(this.medications));
            localStorage.setItem('medHours_history', JSON.stringify(this.doseHistory));
            localStorage.setItem('medHours_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showToast('فشل في حفظ البيانات', 'error');
        }
    }
    
    // ============ تطبيق الإعدادات ============
    applySettings() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        document.documentElement.style.setProperty('--primary-color', this.settings.primaryColor);
        document.documentElement.style.setProperty('--primary-dark', this.adjustColor(this.settings.primaryColor, -20));
        document.documentElement.style.setProperty('--primary-light', this.adjustColor(this.settings.primaryColor, 80));
        
        if (this.elements.themeColorMeta) {
            this.elements.themeColorMeta.setAttribute('content', this.settings.primaryColor);
        }
        
        document.documentElement.lang = this.settings.language;
        document.documentElement.dir = this.settings.language === 'ar' ? 'rtl' : 'ltr';
        
        const themeIcon = this.settings.theme === 'dark' ? '☀️' : '🌙';
        if (this.elements.themeToggle) {
            this.elements.themeToggle.querySelector('.icon').textContent = themeIcon;
        }
    }
    
    // ============ إعداد مستمعي الأحداث ============
    setupEventListeners() {
        // نموذج الدواء
        this.elements.medicationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMedicationSubmit();
        });
        
        // إضافة دواء
        document.getElementById('addMedicationBtn').addEventListener('click', () => {
            this.openModal('add');
        });
        
        // مسح البيانات
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.showConfirm(
                this.settings.language === 'ar' ? 
                    'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.' : 
                    'Are you sure you want to clear all data? This cannot be undone.',
                () => this.clearAllData()
            );
        });
        
        // أزرار الإعدادات
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.langToggle.addEventListener('click', () => this.toggleLanguage());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettingsModal());
        document.getElementById('aboutBtn').addEventListener('click', () => this.openAboutModal());
        
        // نوافذ التأكيد
        this.elements.confirmNo.addEventListener('click', () => this.closeConfirmModal());
        
        // ألوان الثيم
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeThemeColor(e.target.dataset.color));
        });
        
        // إغلاق النوافذ عند النقر خارجها
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });
    }
    
    // ============ عرض شاشة البداية ============
    showSplashScreen() {
        setTimeout(() => {
            this.elements.splashScreen.style.opacity = '0';
            this.elements.splashScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                this.elements.splashScreen.classList.add('hidden');
                this.elements.app.classList.remove('hidden');
                this.elements.app.style.animation = 'fadeIn 0.5s ease';
            }, 500);
        }, 2000);
    }
    
    // ============ طلب إذن الإشعارات ============
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return;
        }
        
        if (Notification.permission === 'granted') {
            this.settings.notificationsEnabled = true;
        } else if (Notification.permission !== 'denied') {
            try {
                const permission = await Notification.requestPermission();
                this.settings.notificationsEnabled = permission === 'granted';
                this.saveData();
            } catch (error) {
                console.error('Error requesting notification permission:', error);
            }
        }
    }
    
    // ============ تسجيل Service Worker ============
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/Med-Hours/service-worker.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    // ============ معالجة تثبيت PWA ============
    handleInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.elements.installBtn.classList.remove('hidden');
        });
        
        this.elements.installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.elements.installBtn.classList.add('hidden');
                this.showToast(
                    this.settings.language === 'ar' ? 'تم تثبيت التطبيق بنجاح' : 'App installed successfully',
                    'success'
                );
            }
            
            deferredPrompt = null;
        });
        
        window.addEventListener('appinstalled', () => {
            this.elements.installBtn.classList.add('hidden');
            console.log('PWA installed');
        });
    }
    
    // ============ إدارة النوافذ ============
    openModal(mode = 'add', medicationIndex = null) {
        if (mode === 'add') {
            this.elements.modalTitle.textContent = this.settings.language === 'ar' ? 'إضافة دواء جديد' : 'Add New Medication';
            this.elements.medicationForm.reset();
            this.elements.lastDose.value = this.formatDateTimeLocal(new Date());
            this.elements.medicationForm.dataset.mode = 'add';
            this.elements.medicationForm.dataset.index = '';
        } else if (mode === 'edit' && medicationIndex !== null) {
            const med = this.medications[medicationIndex];
            this.elements.modalTitle.textContent = this.settings.language === 'ar' ? 'تعديل الدواء' : 'Edit Medication';
            this.elements.medName.value = med.name;
            this.elements.doseInterval.value = med.interval;
            this.elements.lastDose.value = this.formatDateTimeLocal(new Date(med.lastDose));
            this.elements.medicationForm.dataset.mode = 'edit';
            this.elements.medicationForm.dataset.index = medicationIndex;
        }
        
        this.elements.medicationModal.classList.remove('hidden');
        setTimeout(() => {
            this.elements.medName.focus();
        }, 100);
    }
    
    closeModal() {
        this.elements.medicationModal.classList.add('hidden');
    }
    
    showConfirm(message, callback) {
        this.elements.confirmMessage.textContent = message;
        this.elements.confirmYes.onclick = () => {
            callback();
            this.closeConfirmModal();
        };
        this.elements.confirmModal.classList.remove('hidden');
    }
    
    closeConfirmModal() {
        this.elements.confirmModal.classList.add('hidden');
    }
    
    openAboutModal() {
        this.elements.aboutModal.classList.remove('hidden');
    }
    
    closeAboutModal() {
        this.elements.aboutModal.classList.add('hidden');
    }
    
    openSettingsModal() {
        this.updateColorOptions();
        this.elements.settingsModal.classList.remove('hidden');
    }
    
    closeSettingsModal() {
        this.elements.settingsModal.classList.add('hidden');
    }
    
    closeAllModals() {
        this.closeModal();
        this.closeConfirmModal();
        this.closeAboutModal();
        this.closeSettingsModal();
    }
    
    // ============ تبديل الثيم ============
    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applySettings();
        this.saveData();
    }
    
    // ============ تبديل اللغة ============
    toggleLanguage() {
        this.settings.language = this.settings.language === 'ar' ? 'en' : 'ar';
        this.applySettings();
        this.saveData();
        this.updateUI();
        this.showToast(
            this.settings.language === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English',
            'success'
        );
    }
    
    // ============ تغيير لون الثيم ============
    changeThemeColor(color) {
        this.settings.primaryColor = color;
        this.applySettings();
        this.saveData();
        this.updateColorOptions();
    }
    
    updateColorOptions() {
        document.querySelectorAll('.color-option').forEach(btn => {
            if (btn.dataset.color === this.settings.primaryColor) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // ============ معالجة النموذج ============
    handleMedicationSubmit() {
        const name = this.elements.medName.value.trim();
        const interval = parseInt(this.elements.doseInterval.value);
        const lastDose = new Date(this.elements.lastDose.value).getTime();
        
        if (!name || !interval || !lastDose) {
            this.showToast(
                this.settings.language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
                'error'
            );
            return;
        }
        
        if (interval < 1 || interval > 72) {
            this.showToast(
                this.settings.language === 'ar' ? 'يجب أن يكون التكرار بين 1 و 72 ساعة' : 'Interval must be between 1 and 72 hours',
                'error'
            );
            return;
        }
        
        const medication = {
            id: Date.now().toString(),
            name,
            interval,
            lastDose,
            nextDose: lastDose + (interval * 60 * 60 * 1000),
            createdAt: Date.now(),
            oneMinuteNotified: false,
            doseNotified: false
        };
        
        const mode = this.elements.medicationForm.dataset.mode;
        
        if (mode === 'add') {
            this.medications.push(medication);
            this.showToast(
                this.settings.language === 'ar' ? 'تمت إضافة الدواء بنجاح' : 'Medication added successfully',
                'success'
            );
        } else if (mode === 'edit') {
            const index = parseInt(this.elements.medicationForm.dataset.index);
            medication.id = this.medications[index].id;
            medication.createdAt = this.medications[index].createdAt;
            this.medications[index] = medication;
            this.showToast(
                this.settings.language === 'ar' ? 'تم تحديث الدواء بنجاح' : 'Medication updated successfully',
                'success'
            );
        }
        
        this.saveData();
        this.closeModal();
        this.updateUI();
        this.startTimer(medication.id);
    }
    
    // ============ أخذ الجرعة ============
    takeDose(medicationId) {
        const index = this.medications.findIndex(med => med.id === medicationId);
        if (index === -1) return;
        
        const now = Date.now();
        const med = this.medications[index];
        
        // إضافة للسجل
        const historyEntry = {
            id: Date.now().toString(),
            medicationName: med.name,
            medicationId: med.id,
            takenAt: now,
            formattedTime: this.formatTime(now),
            formattedDate: this.formatDate(now)
        };
        
        this.doseHistory.unshift(historyEntry);
        
        // الاحتفاظ بآخر 20 جرعة فقط
        if (this.doseHistory.length > 20) {
            this.doseHistory = this.doseHistory.slice(0, 20);
        }
        
        // تحديث الدواء
        med.lastDose = now;
        med.nextDose = now + (med.interval * 60 * 60 * 1000);
        med.oneMinuteNotified = false;
        med.doseNotified = false;
        
        this.saveData();
        this.updateUI();
        this.startTimer(med.id);
        
        // اهتزاز إذا كان مدعوماً
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        
        this.showToast(
            `${this.settings.language === 'ar' ? 'تم تسجيل الجرعة:' : 'Dose recorded:'} ${med.name}`,
            'success'
        );
    }
    
    // ============ نسخ معلومات الدواء ============
    copyMedicationInfo(med) {
        const lastDose = this.formatDateTime(med.lastDose);
        const nextDose = this.formatDateTime(med.nextDose);
        const text = `${med.name}\n${this.settings.language === 'ar' ? 'آخر جرعة' : 'Last Dose'}: ${lastDose}\n${this.settings.language === 'ar' ? 'الجرعة القادمة' : 'Next Dose'}: ${nextDose}\n${this.settings.language === 'ar' ? 'التكرار' : 'Interval'}: ${med.interval} ${this.settings.language === 'ar' ? 'ساعات' : 'hours'}`;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showToast(
                this.settings.language === 'ar' ? 'تم نسخ المعلومات' : 'Information copied',
                'success'
            );
        }).catch(() => {
            this.showToast(
                this.settings.language === 'ar' ? 'فشل النسخ' : 'Copy failed',
                'error'
            );
        });
    }
    
    // ============ حذف دواء ============
    deleteMedication(medicationId) {
        const med = this.medications.find(m => m.id === medicationId);
        const message = this.settings.language === 'ar' 
            ? `هل أنت متأكد من حذف ${med.name}؟`
            : `Are you sure you want to delete ${med.name}?`;
        
        this.showConfirm(message, () => {
            this.medications = this.medications.filter(m => m.id !== medicationId);
            this.stopTimer(medicationId);
            this.saveData();
            this.updateUI();
            this.showToast(
                this.settings.language === 'ar' ? 'تم حذف الدواء' : 'Medication deleted',
                'success'
            );
        });
    }
    
    // ============ مسح جميع البيانات ============
    clearAllData() {
        this.medications = [];
        this.doseHistory = [];
        this.stopAllTimers();
        localStorage.removeItem('medHours_medications');
        localStorage.removeItem('medHours_history');
        // نحتفظ بالإعدادات
        this.updateUI();
        this.showToast(
            this.settings.language === 'ar' ? 'تم مسح جميع البيانات' : 'All data cleared',
            'success'
        );
    }
    
    // ============ إدارة المؤقتات ============
    startAllTimers() {
        this.stopAllTimers();
        this.medications.forEach(med => this.startTimer(med.id));
    }
    
    startTimer(medicationId) {
        this.stopTimer(medicationId);
        
        const timer = setInterval(() => {
            this.updateMedicationDisplay(medicationId);
            this.updateStats();
            this.checkDoseDue(medicationId);
        }, 1000); // تحديث كل ثانية
        
        this.timers.set(medicationId, timer);
    }
    
    stopTimer(medicationId) {
        if (this.timers.has(medicationId)) {
            clearInterval(this.timers.get(medicationId));
            this.timers.delete(medicationId);
        }
    }
    
    stopAllTimers() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers.clear();
    }
    
    // ============ التحقق من موعد الجرعة ========
