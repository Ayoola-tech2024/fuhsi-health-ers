import React from 'react';
import { Shield, Lock, Scale, X, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function LegalNoticeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D2040] text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <Scale className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Legal, IP & Privacy Policy</h2>
              <p className="text-[11px] text-slate-300">FUHSI Emergency Response System (FUHSI ERS)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 leading-relaxed">
          {/* Section 1: Copyright & IP Notice */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Proprietary Intellectual Property & Copyright Notice</span>
            </div>
            <p className="text-slate-700">
              <strong>Copyright © 2026 Federal University of Health Sciences, Ila-Orangun (FUHSI). All Rights Reserved.</strong>
            </p>
            <p>
              The FUHSI Health Emergency Response Platform, including its user interface architecture, 
              <strong> Location-Aware Emergency Radar</strong>, <strong>Proxy SOS Dispatch Protocol for Trusted Friends</strong>, 
              and <strong>Real-Time Clinician Triage Synchronization Mesh</strong>, constitutes protected proprietary intellectual property.
            </p>
            <p>
              Unauthorized copying, source code extraction, reverse engineering, redistribution, derivative works, or white-label commercial deployment without express written authorization from the University Vice-Chancellor or Authorized Legal Representatives is strictly prohibited and subject to civil litigation and statutory penalties under the <em>Nigerian Copyright Act 2022</em> and <em>WIPO International Treaties</em>.
            </p>
          </div>

          {/* Section 2: Privacy & Health Data Confidentiality */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Student Medical Privacy & NDPR Compliance</span>
            </div>
            <p>
              FUHSI ERS adheres to strict patient-confidentiality standards and the <em>Nigeria Data Protection Regulation (NDPR)</em>:
            </p>
            <ul className="space-y-2 pl-2">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Emergency-Restricted Access:</strong> Blood group, allergies, chronic conditions, and emergency notes are encrypted and accessible strictly by authorized university health staff and emergency responders during active clinical situations.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Telemetry Minimization:</strong> GPS geolocation is queried solely for emergency dispatch, nearby clinic routing, and first-aider navigation, and ceases background tracking immediately upon incident resolution.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero Commercial Sale:</strong> Student medical profiles, phone numbers, and emergency contact lists are strictly protected and never monetized or shared with third-party advertising brokers.</span>
              </li>
            </ul>
          </div>

          {/* Section 3: Proxy SOS & Trusted Friends Policy */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Proxy SOS (Trigger for Trusted Friends) Guidelines</span>
            </div>
            <p>
              Students may configure up to 3 trusted peers to dispatch emergency assistance on their behalf when a peer is incapacitated, out of battery, or without cellular data. When a Proxy SOS is triggered:
            </p>
            <p className="bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-200">
              The friend’s medical profile is transmitted to the emergency center as the primary patient, while the initiating student is logged as the reporting on-scene guardian with their live GPS beacon.
            </p>
          </div>

          {/* Section 4: Fair Use & False Alarm Penalties */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Emergency Dispatch Integrity</span>
            </div>
            <p>
              FUHSI ERS is a critical life-safety system. Deliberate false alarms, synthetic distress triggers, or abusive misuse of university ambulance resources are subject to disciplinary measures under the University Student Code of Conduct.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            FUHSI-ERS-LEGAL-v1.4 • Certified IP Protection
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#0D2040] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            I Acknowledge & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
