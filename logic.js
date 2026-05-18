
        let patients = JSON.parse(localStorage.getItem('zamzam_patients')) || [];
        let accounts = JSON.parse(localStorage.getItem('zamzam_accounts')) || [];
        let currentRole = "";
        let currentActivePatientId = null;
        let updateModal = null;
        let confirmModal = null;
        let confirmCallback = null;

        // تجهيز مظهر التاريخ اليوم تلقائياً بالفورم الرئيسي
        document.getElementById('pDate').valueAsDate = new Date();

        // تفعيل الـ Modal الخاص بالـ Bootstrap
        document.addEventListener("DOMContentLoaded", function() {
            updateModal = new bootstrap.Modal(document.getElementById('updatePatientModal'));
            confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
            document.getElementById('confirmModalConfirmBtn').addEventListener('click', function() {
                if (typeof confirmCallback === 'function') {
                    confirmCallback();
                }
                confirmModal.hide();
            });
            initAuthPages();
        });

        function showConfirm(message, onConfirm) {
            confirmCallback = onConfirm;
            document.getElementById('confirmModalBody').innerText = message;
            confirmModal.show();
        }

        function initAuthPages() {
            accounts = JSON.parse(localStorage.getItem('zamzam_accounts')) || [];
            let savedSession = JSON.parse(localStorage.getItem('zamzam_session'));
            let savedPage = localStorage.getItem('zamzam_currentPage') || 'home';
            
            // If there's an active session, restore it
            if (savedSession && savedSession.username && savedSession.role) {
                currentRole = savedSession.role;
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('mainSystem').classList.add('active');
                let roleTitle = currentRole === 'doctor' ? 'الطبيب' : 'السكرتارية';
                document.getElementById('userDisplayBadge').innerHTML = `<span class="badge text-primary fs-6">${roleTitle}</span>`;
                switchPage(savedPage);
            } else if (accounts.length === 0) {
                switchAuthPage('signup');
            } else {
                switchAuthPage('login');
            }
        }

        function showToast(message, type = 'primary') {
            let toastEl = document.getElementById('appToast');
            let toastBody = document.getElementById('appToastBody');
            if (!toastEl || !toastBody) return;

            toastBody.innerText = message;
            toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
            let toast = new bootstrap.Toast(toastEl, { delay: 3500 });
            toast.show();
        }

        function switchAuthPage(page) {
            document.getElementById('loginPage').style.display = page === 'login' ? 'block' : 'none';
            document.getElementById('signupPage').style.display = page === 'signup' ? 'block' : 'none';
        }

        // 1. نظام تسجيل الدخول
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            let username = document.getElementById('username').value.trim();
            let password = document.getElementById('password').value;
            let selectedRole = document.getElementById('loginRole').value;

            if (!username || !password) {
                showToast('برجاء إدخال اسم المستخدم وكلمة المرور.', 'warning');
                return;
            }

            let matched = accounts.find(acc => acc.username === username && acc.password === password);
            if (!matched) {
                if (accounts.length === 0) {
                    showToast('لا يوجد حسابات بعد، برجاء إنشاء حساب أولاً.', 'warning');
                    switchAuthPage('signup');
                } else {
                    showToast('اسم المستخدم أو كلمة المرور غير صحيحة. حاول مرة أخرى أو أنشئ حساباً جديداً.', 'danger');
                }
                return;
            }

            if (matched.role !== selectedRole) {
                showToast('اخترت الصلاحية غير الصحيحة. تأكد من اختيار النوع المناسب.', 'danger');
                return;
            }

            currentRole = matched.role;
            // Save session to localStorage
            localStorage.setItem('zamzam_session', JSON.stringify({ username: username, role: matched.role }));
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainSystem').classList.add('active');

            let roleTitle = currentRole === 'doctor' ? 'الطبيب' : 'السكرتارية';
            document.getElementById('userDisplayBadge').innerHTML = `<span class="badge text-primary fs-6">${roleTitle}</span>`;
            switchPage('home');
        });

        document.getElementById('signupForm').addEventListener('submit', function(e) {
            e.preventDefault();
            let username = document.getElementById('signupUsername').value.trim();
            let password = document.getElementById('signupPassword').value;
            let confirmPassword = document.getElementById('signupConfirmPassword').value;
            let role = document.getElementById('signupRole').value;

            if (!username || !password || !confirmPassword) {
                showToast('جميع الحقول مطلوبة لإنشاء حساب.', 'warning');
                return;
            }

            if (password !== confirmPassword) {
                showToast('كلمة المرور وتأكيدها غير متطابقين.', 'danger');
                return;
            }

            if (accounts.some(acc => acc.username === username)) {
                showToast('اسم المستخدم هذا مستخدم بالفعل. اختر اسماً آخر.', 'danger');
                return;
            }

            let newAccount = {
                id: Date.now(),
                username: username,
                password: password,
                role: role
            };

            accounts.push(newAccount);
            localStorage.setItem('zamzam_accounts', JSON.stringify(accounts));

            showToast('تم إنشاء الحساب بنجاح! الآن يمكنك تسجيل الدخول.', 'success');
            document.getElementById('signupForm').reset();
            switchAuthPage('login');
        });

        function logout() {
            currentRole = "";
            localStorage.removeItem('zamzam_session');
            localStorage.removeItem('zamzam_currentPage');
            document.getElementById('mainSystem').classList.remove('active');
            switchAuthPage('login');
        }

        // 2. حساب نسبة الطبيب تلقائياً (60%) للفورمين الاضافة والتعديل
        function calculateDoctorShare(costInputId, shareInputId) {
            let cost = parseFloat(document.getElementById(costInputId).value) || 0;
            let share = cost * 0.60;
            document.getElementById(shareInputId).value = share.toFixed(2);
        }

        // 3. التنقل بين الصفحات
        function switchPage(pageName) {
            document.querySelectorAll('.sub-section').forEach(sec => sec.style.display = 'none');
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

            // Save current page to localStorage
            localStorage.setItem('zamzam_currentPage', pageName);

            if(pageName === 'home') {
                document.getElementById('homeSection').style.display = 'block';
                document.getElementById('navHome').classList.add('active');
            } else if(pageName === 'records') {
                document.getElementById('recordsSection').style.display = 'block';
                document.getElementById('navRecords').classList.add('active');
                renderPatientsTable();
            } else if(pageName === 'accounts') {
                document.getElementById('accountsSection').style.display = 'block';
                document.getElementById('navAccounts').classList.add('active');
                renderAccountsPage();
            } else if(pageName === 'profile') {
                document.getElementById('patientProfileSection').style.display = 'block';
            }
        }

        function formatCurrency(value) {
            let num = parseFloat(value || 0);
            return num.toLocaleString('ar-EG', {minimumFractionDigits: num % 1 === 0 ? 0 : 2}) + ' ج.م';
        }

        function renderAccountsPage() {
            let totalCost = 0;
            let totalPaid = 0;
            let totalRemaining = 0;
            let totalDoctorRemaining = 0;

            patients.forEach(p => {
                let cost = parseFloat(p.cost) || 0;
                let paid = parseFloat(p.paid) || 0;
                let remaining = Math.max(0, cost - paid);
                totalCost += cost;
                totalPaid += paid;
                totalRemaining += remaining;
                totalDoctorRemaining += remaining * 0.60;
            });

            document.getElementById('totalCostValue').innerText = formatCurrency(totalCost);
            document.getElementById('totalPaidValue').innerText = formatCurrency(totalPaid);
            document.getElementById('totalRemainingValue').innerText = formatCurrency(totalRemaining);
            document.getElementById('totalDoctorRemainingValue').innerText = formatCurrency(totalDoctorRemaining);

            let summaryBody = document.getElementById('accountsSummaryBody');
            let debtorsBody = document.getElementById('debtorsTableBody');
            summaryBody.innerHTML = '';
            debtorsBody.innerHTML = '';

            let ordered = patients.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
            if (ordered.length === 0) {
                summaryBody.innerHTML = `<div class="col-12 text-center text-muted py-4">لا توجد سجلات مرضى.</div>`;
                debtorsBody.innerHTML = `<div class="col-12 text-center text-muted py-4">لا توجد مرضى عليهم فلوس.</div>`;
                return;
            }

            ordered.forEach(p => {
                let cost = parseFloat(p.cost) || 0;
                let paid = parseFloat(p.paid) || 0;
                let remaining = Math.max(0, cost - paid);
                let doctorShare = cost * 0.60;
                let doctorRemaining = remaining * 0.60;
                let paymentDate = p.date || '-';

                summaryBody.innerHTML += `
                    <div class="col-12">
                        <div class="row g-3 account-summary-row">
                            <div class="col-12">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="mb-0 fw-bold">${p.name}</h6>
                                    <span class="badge bg-primary-subtle text-primary">${paymentDate}</span>
                                </div>
                            </div>
                            <div class="col-6 col-md-4 col-xl-2">
                                <div class="account-field-card">
                                    <div class="field-label">التكلفة</div>
                                    <div class="field-value">${formatCurrency(cost)}</div>
                                </div>
                            </div>
                            <div class="col-6 col-md-4 col-xl-2">
                                <div class="account-field-card">
                                    <div class="field-label">المدفوع</div>
                                    <div class="field-value">${formatCurrency(paid)}</div>
                                </div>
                            </div>
                            <div class="col-6 col-md-4 col-xl-2">
                                <div class="account-field-card">
                                    <div class="field-label">المتبقي</div>
                                    <div class="field-value">${formatCurrency(remaining)}</div>
                                </div>
                            </div>
                            <div class="col-6 col-md-4 col-xl-2">
                                <div class="account-field-card">
                                    <div class="field-label">حصة الطبيب 60%</div>
                                    <div class="field-value">${formatCurrency(doctorShare)}</div>
                                </div>
                            </div>
                            <div class="col-6 col-md-4 col-xl-2">
                                <div class="account-field-card">
                                    <div class="field-label">حصة الطبيب من المتبقي</div>
                                    <div class="field-value">${formatCurrency(doctorRemaining)}</div>
                                </div>
                            </div>
                        </div>
                    </div>`;

                if (remaining > 0) {
                    debtorsBody.innerHTML += `
                        <div class="col-12">
                            <div class="row g-3 account-summary-row debtors-row">
                                <div class="col-12">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h6 class="mb-0 fw-bold">${p.name}</h6>
                                        <span class="badge bg-danger-subtle text-danger">${paymentDate}</span>
                                    </div>
                                </div>
                                <div class="col-6 col-md-4">
                                    <div class="account-field-card">
                                        <div class="field-label">المتبقي</div>
                                        <div class="field-value">${formatCurrency(remaining)}</div>
                                    </div>
                                </div>
                                <div class="col-6 col-md-4">
                                    <div class="account-field-card">
                                        <div class="field-label">حصة الطبيب من المتبقي</div>
                                        <div class="field-value">${formatCurrency(doctorRemaining)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                }
            });

            if (debtorsBody.innerHTML === '') {
                debtorsBody.innerHTML = `<div class="col-12 text-center text-muted py-4">لا يوجد مرضى عليهم فلوس.</div>`;
            }
        }

        // 4. إضافة مريض جديد وحفظه
        document.getElementById('patientForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            let newPatient = {
                id: Date.now(),
                name: document.getElementById('pName').value,
                phone: document.getElementById('pPhone').value,
                date: document.getElementById('pDate').value,
                procedure: document.getElementById('pProcedure').value,
                cost: parseFloat(document.getElementById('pCost').value),
                paid: parseFloat(document.getElementById('pPaid').value),
                docShare: parseFloat(document.getElementById('pDocShare').value),
                notes: [],
                images: []
            };

            patients.push(newPatient);
            localStorage.setItem('zamzam_patients', JSON.stringify(patients));
            
            showToast("تم حفظ بيانات المريض الجديد بنجاح!", 'success');
            document.getElementById('patientForm').reset();
            document.getElementById('pDate').valueAsDate = new Date();
            switchPage('records');
        });

        // 5. عرض جدول ملفات المرضى
        function renderPatientsTable() {
            let tbody = document.getElementById('patientsTableBody');
            let searchQuery = document.getElementById('searchBox').value.toLowerCase();
            tbody.innerHTML = "";

            let filtered = patients.filter(p => p.name.toLowerCase().includes(searchQuery));

            if(filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">لا توجد سجلات مرضى.</td></tr>`;
                return;
            }

            filtered.forEach(p => {
                let tr = document.createElement('tr');
                tr.className = "patient-row";
                tr.innerHTML = `
                    <td data-label="التاريخ" class="small text-muted">${p.date}</td>
                    <td data-label="اسم المريض" class="fw-bold text-primary" style="cursor:pointer;" onclick="openPatientProfile(${p.id})">${p.name}</td>
                    <td data-label="الهاتف" class="small">${p.phone}</td>
                    <td data-label="الإجراء"><span class="badge bg-primary-soft text-primary">${p.procedure}</span></td>
                    <td data-label="التكلفة">${p.cost} ج.م</td>
                    <td data-label="المدفوع">${p.paid} ج.م</td>
                    <td data-label="نسبة الطبيب" class="text-success fw-bold">${p.docShare} ج.م</td>
                    <td data-label="العمليات">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="openUpdateModal(event, ${p.id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deletePatient(event, ${p.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // 6. فتح الفورم المخصص للتعديل (Modal) وملء بياناته القديمة
        function openUpdateModal(event, id) {
            event.stopPropagation(); // منع الانتقال لصفحة البروفايل عند الضغط على الزر
            let p = patients.find(p => p.id === id);
            if(!p) return;

            document.getElementById('editPatientId').value = p.id;
            document.getElementById('editPName').value = p.name;
            document.getElementById('editPPhone').value = p.phone;
            document.getElementById('editPDate').value = p.date;
            document.getElementById('editPProcedure').value = p.procedure;
            document.getElementById('editPCost').value = p.cost;
            document.getElementById('editPPaid').value = p.paid;
            document.getElementById('editPDocShare').value = p.docShare;

            updateModal.show(); // إظهار نافذة التعديل المنبثقة
        }

        // حفظ التعديلات الجديدة للمريض
        document.getElementById('updatePatientForm').addEventListener('submit', function(e) {
            e.preventDefault();
            let id = parseInt(document.getElementById('editPatientId').value);
            let index = patients.findIndex(p => p.id === id);

            if(index !== -1) {
                // تحديث الحقول الأساسية مع الاحتفاظ بالملاحظات والصور القديمة دون مسحها
                patients[index].name = document.getElementById('editPName').value;
                patients[index].phone = document.getElementById('editPPhone').value;
                patients[index].date = document.getElementById('editPDate').value;
                patients[index].procedure = document.getElementById('editPProcedure').value;
                patients[index].cost = parseFloat(document.getElementById('editPCost').value);
                patients[index].paid = parseFloat(document.getElementById('editPPaid').value);
                patients[index].docShare = parseFloat(document.getElementById('editPDocShare').value);

                localStorage.setItem('zamzam_patients', JSON.stringify(patients));
                updateModal.hide(); // إغلاق النافذة
                showToast("تم تحديث وحفظ بيانات المريض بنجاح!", 'success');
                renderPatientsTable();
            }
        });

        // حذف مريض
        function deletePatient(event, id) {
            event.stopPropagation();
            showConfirm('هل أنت متأكد من رغبتك في حذف ملف هذا المريض نهائياً؟', function() {
                patients = patients.filter(p => p.id !== id);
                localStorage.setItem('zamzam_patients', JSON.stringify(patients));
                showToast('تم حذف ملف المريض بنجاح.', 'success');
                renderPatientsTable();
            });
        }

        // 7. فتح صفحة بروفايل المريض وعرض الصور والملاحظات الخاصة به
        function openPatientProfile(id) {
            currentActivePatientId = id;
            let p = patients.find(p => p.id === id);
            if(!p) return;

            // تحديث كارت البيانات المعروض بالجنب
            document.getElementById('profName').innerText = p.name;
            document.getElementById('profPhone').innerText = p.phone;
            document.getElementById('profDate').innerText = p.date;
            document.getElementById('profProcedure').innerText = p.procedure;
            document.getElementById('profCost').innerText = p.cost;
            document.getElementById('profPaid').innerText = p.paid;

            renderNotesAndImages();
            switchPage('profile');
        }

        // دالة لعرض وتحديث الملاحظات والصور من الـ Storage
        function renderNotesAndImages() {
            let p = patients.find(p => p.id === currentActivePatientId);
            if(!p) return;

            // أ. عرض الملاحظات المحفوظة
            let notesList = document.getElementById('notesList');
            notesList.innerHTML = "";
            if(!p.notes || p.notes.length === 0) {
                notesList.innerHTML = `<li class="list-group-item text-muted text-center">لا توجد ملاحظات مسجلة لهذا المريض بعد.</li>`;
            } else {
                p.notes.forEach((note, index) => {
                    notesList.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center shadow-sm mb-1 rounded">
                        <div><i class="fa-solid fa-comment-medical text-primary me-2"></i> ${note}</div>
                        <button class="btn text-danger btn-sm" onclick="deleteNote(${index})"><i class="fa-solid fa-trash-can"></i></button>
                    </li>`;
                });
            }

            // ب. عرض الصور المحفوظة
            let gallery = document.getElementById('imagesGallery');
            gallery.innerHTML = "";
            if(!p.images || p.images.length === 0) {
                gallery.innerHTML = `<p class="text-muted m-2 w-100 text-center py-2">لا توجد صور أشعة مرفوعة حالياً.</p>`;
            } else {
                p.images.forEach((imgSrc, index) => {
                    gallery.innerHTML += `
                        <div class="position-relative d-inline-block m-2 shadow-sm rounded">
                            <img src="${imgSrc}" class="img-thumbnail-custom border" onclick="window.open('${imgSrc}', '_blank')">
                            <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle p-1" style="line-height: 0.6; font-size: 14px;" onclick="deleteImage(${index})">×</button>
                        </div>`;
                });
            }
        }

        // إضافة ملاحظة جديدة وحفظها تلقائياً بملف المريض
        function addNote() {
            let noteTxt = document.getElementById('newNote').value.trim();
            if(!noteTxt) {
                showToast("برجاء كتابة ملاحظة أولاً قبل الحفظ!", 'warning');
                return;
            }

            let index = patients.findIndex(p => p.id === currentActivePatientId);
            if(index !== -1) {
                if(!patients[index].notes) patients[index].notes = [];
                
                let timeStamp = new Date().toLocaleString('ar-EG', {hour12: true});
                patients[index].notes.push(`${noteTxt} - [${timeStamp}]`);
                
                // الحفظ النهائي في LocalStorage
                localStorage.setItem('zamzam_patients', JSON.stringify(patients));
                document.getElementById('newNote').value = ""; // تفريغ الحقل تلقائياً بعد الحفظ
                renderNotesAndImages(); // إعادة تحديث العرض
            }
        }

        function deleteNote(noteIndex) {
            let index = patients.findIndex(p => p.id === currentActivePatientId);
            if(index !== -1) {
                patients[index].notes.splice(noteIndex, 1);
                localStorage.setItem('zamzam_patients', JSON.stringify(patients));
                renderNotesAndImages();
            }
        }

        // رفع صورة جديدة: حفظها بملف المريض (LocalStorage) وأيضاً تنزيلها محلياً عبر المتصفح
        function uploadPatientImage() {
            let fileInput = document.getElementById('imageInput');
            if(fileInput.files.length === 0) return;

            let file = fileInput.files[0];
            let reader = new FileReader();

            reader.onload = function(e) {
                let index = patients.findIndex(p => p.id === currentActivePatientId);
                if(index !== -1) {
                    if(!patients[index].images) patients[index].images = [];

                    // حفظ بيانات الصورة بصيغة DataURL داخل مصفوفة المريض
                    let dataUrl = e.target.result;
                    patients[index].images.push(dataUrl);

                    // الحفظ النهائي في LocalStorage
                    localStorage.setItem('zamzam_patients', JSON.stringify(patients));

                    // محاولة تنزيل الصورة تلقائياً للمستخدم (سيؤدي لفتح حوار التنزيل في المتصفح)
                    try {
                        let ext = (file && file.type && file.type.split('/')[1]) ? file.type.split('/')[1] : 'png';
                        let safeName = (patients[index].name || 'patient').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
                        let filename = `${safeName}_${patients[index].id}_${Date.now()}.${ext}`;
                        let a = document.createElement('a');
                        a.href = dataUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                    } catch(err) {
                        console.warn('Could not auto-download image:', err);
                    }

                    fileInput.value = ""; // تفريغ الحقل ليكون جاهزاً لرفع صورة أخرى
                    renderNotesAndImages(); // إعادة تحديث المعرض فوراً
                } else {
                    showToast('لم يتم تحديد مريض لحفظ الصورة. افتح ملف المريض أولاً.', 'warning');
                }
            };
            reader.readAsDataURL(file);
        }

        function deleteImage(imgIndex) {
            showConfirm('هل تريد حذف هذه الصورة من ملف المريض؟', function() {
                let index = patients.findIndex(p => p.id === currentActivePatientId);
                if(index !== -1) {
                    patients[index].images.splice(imgIndex, 1);
                    localStorage.setItem('zamzam_patients', JSON.stringify(patients));
                    showToast('تم حذف الصورة بنجاح.', 'success');
                    renderNotesAndImages();
                }
            });
        }
    