import React from 'react';
import { AdmissionApplication } from '../../types';
import { Printer, X } from 'lucide-react';

interface AdmissionPrintViewProps {
  application: AdmissionApplication;
  onClose: () => void;
}

export const AdmissionPrintView: React.FC<AdmissionPrintViewProps> = ({
  application,
  onClose,
}) => {
  const { studentDetails: s, familyDetails: f, academicRecord: a, subjectsAndSchemes: sc, declarations: d } = application;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Floating control bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-xl transition"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Sheet Container replicating the 4-page physical form */}
      <div className="w-full max-w-4xl my-auto p-6 sm:p-10 bg-white text-black shadow-2xl rounded-xl print:p-0 print:shadow-none print:m-0 font-serif leading-relaxed text-xs">
        {/* ================= PAGE 1 ================= */}
        <div className="border-2 border-black p-4 mb-8 print:mb-0 print:break-after-page">
          <div className="flex justify-between items-start text-[10px] border-b border-black pb-1 mb-2 font-sans">
            <div>स्थापना वर्ष हाईस्कूल - 1984</div>
            <div className="font-bold text-center">
              डाइस कोड: 23290300210 • संस्था कोड: 561033
            </div>
            <div>उन्नयन वर्ष हायरसेकेण्डरी - 2006</div>
          </div>

          <div className="text-center my-2">
            <h1 className="text-base sm:text-lg font-bold">
              कार्यालय, प्राचार्य शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगाँव
            </h1>
            <div className="text-xs font-semibold">जिला-खण्डवा (म.प्र.)</div>
            <div className="text-[10px] text-gray-700">Email : hss.ahmedpur.khd.mp@gmail.com</div>
          </div>

          {/* Ribbon & Photo */}
          <div className="flex items-center justify-between my-3 border-y-2 border-black py-2">
            <div className="flex-1 text-center font-bold text-sm bg-gray-100 py-1 border border-black mx-2">
              प्रवेश हेतु आवेदन-पत्र (सत्र : {application.academicSession})
            </div>
            <div className="w-24 h-28 border-2 border-black flex flex-col items-center justify-center text-center p-1 text-[9px] shrink-0">
              {s.photoUrl ? (
                <img src={s.photoUrl} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <span>पासपोर्ट फोटो चस्पा करें</span>
              )}
            </div>
          </div>

          {/* Office Use Section */}
          <div className="border border-black p-1.5 mb-3 bg-gray-50 text-[10px]">
            <div className="font-bold border-b border-black pb-0.5 mb-1">कार्यालय उपयोग हेतु (Office Use Only):</div>
            <div className="grid grid-cols-5 gap-2">
              <div>सरल क्रं.: <b>—</b></div>
              <div>दाखिल क्रं.: <b>{application.applicationId}</b></div>
              <div>प्रवेश तिथि: <b>{new Date(application.submittedAt).toLocaleDateString('en-IN')}</b></div>
              <div>प्रवेश कक्षा: <b>{application.targetClass}वीं</b></div>
              <div>संकाय: <b>{sc.stream || 'सामान्य'}</b></div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-2 text-[11px]">
            <div className="border-b border-dotted border-gray-500 pb-1">
              <b>1. विद्यार्थी का पूरा नाम (हिन्दी में):</b> {s.fullNameHindi} &nbsp;&nbsp;&nbsp; <b>सरनेम:</b> {s.surnameHindi}
            </div>
            <div className="border-b border-dotted border-gray-500 pb-1 font-mono tracking-wider">
              <b>Full Name (in English):</b> {s.fullNameEnglish}
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-dotted border-gray-500 pb-1">
              <div><b>2. पिता का नाम (हिन्दी में):</b> {s.fatherNameHindi}</div>
              <div className="font-mono"><b>Father's Name:</b> {s.fatherNameEnglish}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-dotted border-gray-500 pb-1">
              <div><b>3. माता का नाम (हिन्दी में):</b> {s.motherNameHindi}</div>
              <div className="font-mono"><b>Mother's Name:</b> {s.motherNameEnglish}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-dotted border-gray-500 pb-1">
              <div><b>4. लिंग:</b> {s.gender === 'boy' ? 'बालक' : 'बालिका'}</div>
              <div><b>5. जाति वर्ग:</b> {s.category}</div>
              <div><b>6. जाति का नाम:</b> {s.casteName || '—'}</div>
            </div>

            {/* IDs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-b border-dotted border-gray-500 pb-1 font-mono text-[10px]">
              <div><b>7. SSSMID:</b> {s.sssmid}</div>
              <div><b>8. UDISE PEN:</b> {s.udisePen || '—'}</div>
              <div><b>9. परिवार ID:</b> {s.familyId}</div>
              <div><b>10. अपार ID:</b> {s.apaarId || '—'}</div>
              <div><b>11. आधार नंबर:</b> {s.aadhaarNumber ? `XXXX-XXXX-${s.aadhaarNumber.slice(-4)}` : '—'}</div>
              <div><b>14 & 15. ब्लड ग्रुप / ऊँचाई:</b> {s.bloodGroup || '—'} / {s.height || '—'}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-dotted border-gray-500 pb-1">
              <div><b>12. जन्म दिनांक (अंकों में):</b> {s.dobDigits}</div>
              <div><b>जन्म दिनांक (शब्दों में):</b> {s.dobWords || '—'}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-dotted border-gray-500 pb-1">
              <div><b>13. व्हाट्सएप मोबा. नंबर:</b> {s.whatsappMobile}</div>
              <div><b>अन्य मोबा. नंबर:</b> {s.alternateMobile || '—'}</div>
            </div>

            <div className="border border-black p-2 bg-gray-50 text-[10px]">
              <b>16. राष्ट्रीयकृत बैंक विवरण:</b> खाता क्रं: <b>{s.bankAccount}</b> | बैंक: <b>{s.bankName || '—'}</b> | शाखा: <b>{s.branchName || '—'}</b> | IFSC: <b>{s.ifscCode}</b>
            </div>
          </div>
        </div>

        {/* ================= PAGE 2 & 3 ================= */}
        <div className="border-2 border-black p-4 mb-8 print:mb-0 print:break-after-page space-y-3">
          <div className="text-center font-bold border-b border-black pb-1 mb-2 text-xs">
            पृष्ठ 2 : पारिवारिक, निवास एवं पूर्व शैक्षणिक विवरण
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-dotted border-gray-500 pb-1">
            <div><b>17. पिता का व्यवसाय:</b> {f.fatherOccupation}</div>
            <div><b>माता का व्यवसाय:</b> {f.motherOccupation}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-dotted border-gray-500 pb-1">
            <div><b>18. परिवार की वार्षिक आय:</b> ₹{f.annualIncomeDigits} ({f.annualIncomeWords || ''})</div>
            <div><b>19. शासकीय पद/कार्यालय:</b> {f.govtJobDetails || 'लागू नहीं'}</div>
          </div>

          <div className="border-b border-dotted border-gray-500 pb-1">
            <b>20. भाई/बहनों की संख्या:</b> भाई: {f.brothersCount} | बहन: {f.sistersCount} | कुल: {f.brothersCount + f.sistersCount}
            {f.siblingsStudyingInSchool && <div>शाला में अध्ययनरत: {f.siblingsStudyingInSchool}</div>}
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-dotted border-gray-500 pb-1">
            <div><b>22. धर्म:</b> {f.religion}</div>
            <div><b>23. राष्ट्रीयता:</b> {f.nationality}</div>
            <div><b>मातृभाषा:</b> {f.motherTongue}</div>
          </div>

          <div className="border-b border-dotted border-gray-500 pb-1">
            <b>24 & 25. दिव्यांगता:</b> {f.isDivyang ? `हाँ (${f.disabilityType || ''}, ${f.disabilityPercentage || ''}%), UDID: ${f.udidCardNumber || '—'}` : 'नहीं'}
          </div>

          <div className="border-b border-dotted border-gray-500 pb-1">
            <b>26. निवास का स्थायी पता:</b> ग्राम: {f.permanentVillage}, पोस्ट: {f.permanentPost}, मोहल्ला: {f.permanentMohalla || '—'}, जिला: {f.permanentDistrict}, पिनकोड: {f.permanentPincode}, मोबा.: {f.permanentMobile}
          </div>

          {/* Academic Exam Table */}
          <div className="mt-3">
            <b>28. गत वर्ष उत्तीर्ण परीक्षा का विवरण:</b>
            <table className="w-full border-collapse border border-black mt-1 text-center text-[10px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1">संस्था का नाम</th>
                  <th className="border border-black p-1">डाइस कोड</th>
                  <th className="border border-black p-1">उत्तीर्ण कक्षा</th>
                  <th className="border border-black p-1">वर्ष</th>
                  <th className="border border-black p-1">पूर्णांक</th>
                  <th className="border border-black p-1">प्राप्तांक</th>
                  <th className="border border-black p-1">प्रतिशत</th>
                  <th className="border border-black p-1">ग्रेड</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1">{a.previousSchoolName}</td>
                  <td className="border border-black p-1 font-mono">{a.previousSchoolUdise || '—'}</td>
                  <td className="border border-black p-1">{a.passedClass}</td>
                  <td className="border border-black p-1">{a.passedYear}</td>
                  <td className="border border-black p-1">{a.maxMarks}</td>
                  <td className="border border-black p-1">{a.obtainedMarks}</td>
                  <td className="border border-black p-1 font-bold">{a.percentage}</td>
                  <td className="border border-black p-1 font-bold">{a.grade}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Schemes Summary */}
          <div className="border border-black p-2 bg-gray-50 text-[10px] space-y-1 mt-3">
            <b>शासकीय योजनाएं एवं पात्रता स्थिति:</b>
            <div className="grid grid-cols-2 gap-2">
              <div>BPL/APL कार्ड: <b>{sc.isBplOrApl ? `हाँ (${sc.bplCardNumber})` : 'नहीं'}</b></div>
              <div>संबल योजना: <b>{sc.hasSambalCard ? `हाँ (${sc.sambalCardNumber})` : 'नहीं'}</b></div>
              <div>कर्मकार निर्माण कार्ड: <b>{sc.hasKarmakarCard ? `हाँ (${sc.karmakarCardNumberAndYear})` : 'नहीं'}</b></div>
              <div>लाड़ली लक्ष्मी योजना: <b>{sc.hasLadliLaxmi ? `हाँ (${sc.ladliLaxmiRegNumber})` : 'नहीं'}</b></div>
              <div>घर में शौचालय निर्मित एवं उपयोग: <b>{sc.hasHomeToilet ? 'हाँ' : 'नहीं'}</b></div>
              <div>दस्तावेज नाम समानता सत्यापन: <b>{sc.nameConsistencyConfirmed ? 'समान है ✓' : 'नहीं'}</b></div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 4 ================= */}
        <div className="border-2 border-black p-4 space-y-4">
          <div className="text-center font-bold border-b border-black pb-1 mb-2 text-xs">
            पृष्ठ 3 & 4 : घोषणा पत्र एवं कार्यालयीन सत्यापन
          </div>

          {/* Student Declaration */}
          <div className="border border-black p-3 space-y-2">
            <div className="font-bold text-center underline">:: विद्यार्थी का घोषणा पत्र ::</div>
            <p className="leading-relaxed italic text-[11px]">
              "मैं सत्यनिष्ठापूर्वक घोषणा करता/करती हूँ कि मेरे अभिज्ञान से आवेदन पत्र में दी गई उपरोक्त समस्त जानकारी पूर्णतः सत्य है एवं मैं शाला के सभी नियमों का पालन करने की प्रतिज्ञा करता/करती हूँ।"
            </p>
            <div className="flex justify-between items-end pt-4">
              <div>दिनांक: <b>{d.studentDeclarationDate}</b></div>
              <div className="text-center">
                <div className="font-bold">{s.fullNameEnglish}</div>
                <div className="border-t border-black pt-0.5 text-[10px]">विद्यार्थी के हस्ताक्षर</div>
              </div>
            </div>
          </div>

          {/* Parent Declaration */}
          <div className="border border-black p-3 space-y-2">
            <div className="font-bold text-center underline">:: पिता / पालक का घोषणा पत्र ::</div>
            <p className="leading-relaxed italic text-[11px]">
              "मैं घोषणा करता/करती हूँ कि मेरे पुत्र/पुत्री <b>{s.fullNameHindi || s.fullNameEnglish}</b> द्वारा दी गई जानकारी सत्य है। मेरा पुत्र/पुत्री शाला के समस्त नियमों का पालन करेगा/करेगी। यदि नियमों एवं अनुशासन के उल्लंघन के कारण उस पर जो भी उचित कार्यवाही की जाएगी वह मुझे मान्य होगी।"
            </p>
            <div className="flex justify-between items-end pt-4">
              <div>
                स्थान: <b>{d.parentDeclarationPlace || 'अहमदपुर खैगांव'}</b><br />
                दिनांक: <b>{d.parentDeclarationDate}</b>
              </div>
              <div className="text-center">
                <div className="font-bold">{d.parentName || s.fatherNameEnglish}</div>
                <div className="border-t border-black pt-0.5 text-[10px]">पिता / पालक के हस्ताक्षर</div>
              </div>
            </div>
          </div>

          {/* Office Verification Section */}
          <div className="border-2 border-black p-3 bg-gray-50 text-[10px] space-y-4">
            <div className="font-bold text-center underline">कार्यालयीन उपयोग एवं जाँच (Office Verification)</div>
            <p className="italic">
              "मेरे द्वारा उपरोक्त छात्र/छात्रा के आवेदन फार्म की जाँच की गई है इसमें किसी भी प्रकार का कालम रिक्त नहीं एवं आवेदन अभिलेख एवं दस्तावेज अनुसार सही है।"
            </p>

            <div className="grid grid-cols-3 gap-4 pt-6 text-center">
              <div>
                <div className="border-t border-black pt-1">
                  प्रवेश प्रभारी / जमाकर्ता शिक्षक के हस्ताक्षर
                </div>
                <div className="text-[9px] text-gray-500">दिनांक: ___________</div>
              </div>
              <div>
                <div className="border-t border-black pt-1">
                  कक्षा शिक्षक के हस्ताक्षर
                </div>
                <div className="text-[9px] text-gray-500">दिनांक: ___________</div>
              </div>
              <div>
                <div className="border-t border-black pt-1 font-bold">
                  संस्था प्रमुख / प्राचार्य के हस्ताक्षर
                </div>
                <div className="text-[9px] text-gray-500">दिनांक: ___________</div>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] font-bold text-gray-600 border-t border-gray-300 pt-2">
            "सांसे हो रही है कम, आओ पेड़ लगाए हम" • Save Water, Save Life !!
          </div>
        </div>
      </div>
    </div>
  );
};
