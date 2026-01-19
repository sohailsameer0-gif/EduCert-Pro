import React from 'react';
import { AppData, StudentCertificateData } from '../types';

interface TemplateProps {
  data: StudentCertificateData;
  settings: AppData;
  courseName: string;
  durationLabel: string;
  typeTitle: string;
  description: string;
  formattedDate: string;
  qrUrl: string;
  orientation: 'landscape' | 'portrait';
}

// Helper for orientation classes
const getLayoutClasses = (orientation: 'landscape' | 'portrait', type: 'flex' | 'grid' = 'flex') => {
  if (type === 'flex') {
    return orientation === 'portrait' ? 'flex-col' : 'flex-row';
  }
  return '';
};

// --- 1. CLASSIC ACADEMIC ---
export const ClassicTemplate: React.FC<TemplateProps> = ({ settings, data, typeTitle, description, formattedDate, qrUrl, orientation }) => (
  <div className="w-full h-full bg-white p-8 relative">
    {/* Top Right Group: Cert No & Badge */}
    <div className="absolute top-12 right-12 z-20 flex flex-col items-end">
        <div className="text-xs font-serif font-bold text-navy-900 bg-white px-2 mb-2 z-10">
           Cert No: {data.certificateNo}
        </div>
        {settings.institute.badge && (
            <img src={settings.institute.badge} className="h-24 w-24 object-contain opacity-90 relative z-10" alt="Badge" />
        )}
    </div>

    <div className="w-full h-full border-[3px] border-navy-900 p-2">
      <div className="w-full h-full border border-navy-800 relative flex flex-col items-center pt-8 pb-4 px-12 text-center bg-slate-50/30">
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-navy-900 rounded-tl-3xl"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-navy-900 rounded-tr-3xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-navy-900 rounded-bl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-navy-900 rounded-br-3xl"></div>

        {settings.institute.logo && (
          <img src={settings.institute.logo} className="h-24 mb-4 object-contain" alt="Logo" crossOrigin="anonymous" />
        )}

        <h1 className="text-3xl font-serif font-bold text-navy-900 uppercase tracking-widest mb-2">{settings.institute.name}</h1>
        <div className="w-2/3 h-px bg-navy-200 mb-6"></div>

        <h2 className="text-5xl font-official font-bold text-gold-600 mb-6">{typeTitle}</h2>

        <h3 className="text-4xl font-serif font-bold text-navy-900 mb-2 border-b-2 border-slate-300 pb-2 px-8 min-w-[400px]">
          {data.studentName}
        </h3>
        <p className="text-slate-600 font-serif mb-6">Son/Daughter of <strong>{data.fatherName || "________________"}</strong></p>

        <p className="text-lg text-slate-800 leading-relaxed max-w-4xl font-serif mb-8 text-justify px-8">
            {description}
        </p>

        <div className="mt-auto w-full flex justify-between items-end px-10 pb-2">
          <div className="text-center">
            <div className="text-lg font-bold text-navy-900 border-b border-navy-900 pb-1 px-4">{formattedDate}</div>
            <p className="text-xs font-serif italic mt-1">Date Issued</p>
          </div>
          
          <div className="mb-2">
            <img src={qrUrl} className="w-16 h-16 border border-slate-300 p-1" alt="QR" crossOrigin="anonymous"/>
          </div>

          <div className="flex items-end gap-6">
             {/* Seal moved here */}
             {settings.institute.seal && (
                 <img src={settings.institute.seal} className="h-24 w-24 object-contain opacity-80 mb-2" alt="Seal" />
             )}

             <div className="text-center">
                <div className="h-24 flex items-end justify-center mb-1">
                    {settings.institute.signature ? (
                    <img src={settings.institute.signature} className="h-full object-contain" alt="Sig" />
                    ) : <span className="font-signature text-3xl">Signature</span>}
                </div>
                <div className="w-48 h-px bg-navy-900 mt-1"></div>
                <p className="text-xs font-serif italic mt-1">Authorized Signature</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- 2. MODERN PROFESSIONAL ---
export const ModernTemplate: React.FC<TemplateProps> = ({ settings, data, typeTitle, description, formattedDate, qrUrl, orientation }) => (
  <div className={`w-full h-full bg-white flex ${getLayoutClasses(orientation)}`}>
    
    {/* Sidebar / Header */}
    <div className={`${orientation === 'portrait' ? 'w-full h-1/5 flex-row justify-center py-4 gap-6' : 'w-1/3 flex-col py-12'} bg-navy-900 text-white flex items-center relative overflow-hidden`}>
       <div className="absolute top-0 left-0 w-full h-full bg-navy-800 opacity-20 transform -skew-y-12 scale-150 origin-top-left"></div>
       
       <div className="z-10 text-center px-6">
         {settings.institute.logo ? (
           <img src={settings.institute.logo} className={`${orientation === 'portrait' ? 'h-16' : 'h-28'} object-contain mb-4 bg-white rounded-lg p-2 mx-auto`} alt="Logo" crossOrigin="anonymous"/>
         ) : <div className="h-20 w-20 bg-white/10 rounded-full mb-4 mx-auto"></div>}
         
         <div className="text-gold-400 tracking-[0.2em] uppercase text-xs font-bold mb-1">Presented By</div>
         <h1 className={`${orientation === 'portrait' ? 'text-xl' : 'text-2xl'} font-bold leading-tight`}>{settings.institute.name}</h1>
       </div>
    </div>

    {/* Content */}
    <div className={`${orientation === 'portrait' ? 'w-full h-4/5 p-8' : 'w-2/3 p-12'} flex flex-col justify-center relative bg-white`}>
       
       {/* Top Right Group: Cert No & Badge */}
       <div className="absolute top-6 right-8 flex flex-col items-end z-10">
          <div className="text-xs text-slate-400 font-bold mb-2">No: {data.certificateNo}</div>
          {settings.institute.badge && (
              <img src={settings.institute.badge} className="h-20 w-20 object-contain opacity-90" alt="Badge" />
          )}
       </div>

       <div className="mt-8">
          <h2 className="text-4xl font-bold text-slate-800 uppercase tracking-tight mb-1">{typeTitle}</h2>
          <div className="w-20 h-1.5 bg-gold-500 mb-8"></div>

          <p className="text-slate-500 uppercase tracking-widest text-sm font-bold mb-2">Awarded To</p>
          <h3 className="text-5xl font-bold text-navy-900 mb-2">{data.studentName}</h3>
          <p className="text-slate-400 text-lg mb-8">S/O {data.fatherName}</p>

          <div className="bg-slate-50 p-6 rounded-l-xl border-l-4 border-gold-400 mb-8 overflow-hidden">
              <p className="text-lg text-slate-700 leading-relaxed font-medium text-justify">
                {description}
              </p>
          </div>
       </div>

       <div className="mt-auto flex justify-between items-end">
          {/* Date */}
          <div className="text-left">
            <p className="text-xs uppercase text-slate-400 font-bold mb-1">Date Issued</p>
            <p className="text-lg font-bold text-navy-900">{formattedDate}</p>
          </div>

          {/* QR Code */}
          <div className="mb-1">
             <img src={qrUrl} className="h-16 w-16 border border-slate-200 p-1" alt="QR"/>
          </div>

          {/* Seal & Signature Group */}
          <div className="flex items-end gap-4 text-right">
             {settings.institute.seal && (
                 <img src={settings.institute.seal} className="h-20 w-20 object-contain opacity-80 mb-1" alt="Seal" />
             )}
             
             <div>
                <div className="h-20 flex justify-end items-end mb-2">
                    {settings.institute.signature ? (
                      <img src={settings.institute.signature} className="h-full object-contain" alt="Sig"/>
                    ) : <span className="font-signature text-2xl text-slate-800">Signature</span>}
                </div>
                <div className="w-40 h-px bg-slate-300 mt-1 mb-1"></div>
                <p className="text-xs uppercase text-slate-400 font-bold">Director Signature</p>
             </div>
          </div>
       </div>
    </div>
  </div>
);

// --- 3. CORPORATE EXPERIENCE ---
export const CorporateTemplate: React.FC<TemplateProps> = ({ settings, data, courseName, typeTitle, description, formattedDate, qrUrl, orientation }) => (
  <div className="w-full h-full bg-white relative p-12 flex flex-col">
    {/* Top colored bar */}
    <div className="absolute top-0 left-0 w-full h-4 bg-slate-200 flex">
      <div className="w-1/3 bg-blue-900 h-full"></div>
      <div className="w-1/3 bg-blue-700 h-full"></div>
      <div className="w-1/3 bg-blue-500 h-full"></div>
    </div>

    {/* Top Right Group: Cert No & Badge */}
    <div className="absolute top-8 right-8 z-20 flex flex-col items-end">
        <div className="text-xs text-blue-600 font-bold mb-2 tracking-wider">Cert No: {data.certificateNo}</div>
        {settings.institute.badge && (
            <img src={settings.institute.badge} className="h-24 w-24 object-contain opacity-90" alt="Badge" />
        )}
    </div>

    {/* Header */}
    <div className="mt-8 flex justify-between items-end border-b border-slate-200 pb-6 mb-8 relative z-10">
      <div className="flex items-center gap-4">
        {settings.institute.logo && <img src={settings.institute.logo} className="h-20 object-contain" alt="Logo" crossOrigin="anonymous"/>}
        <div className="text-left">
           <h1 className="text-xl font-bold text-slate-800 uppercase">{settings.institute.name}</h1>
           <p className="text-xs text-slate-500">{settings.institute.address}</p>
        </div>
      </div>
      <div className="text-right mr-32"> {/* Margin to avoid badge overlap */}
        <h2 className="text-3xl font-bold text-blue-900 uppercase">{typeTitle}</h2>
      </div>
    </div>

    {/* Body */}
    <div className="px-8 text-center flex-1">
       <p className="text-sm text-slate-500 uppercase tracking-[0.3em] mb-6">This document certifies that</p>
       
       <h3 className="text-4xl font-serif font-bold text-slate-900 mb-2">{data.studentName}</h3>
       <p className="text-slate-500 mb-10">Father's Name: {data.fatherName}</p>

       <div className="max-w-4xl mx-auto mb-12 text-justify">
         <p className="text-xl text-slate-700 leading-8">
           {description}
         </p>
       </div>

       {/* Course & Date Grid */}
       <div className="grid grid-cols-2 gap-8 border-t border-b border-slate-100 py-6 mb-8 max-w-4xl mx-auto">
          <div className="text-center border-r border-slate-100">
             <span className="block text-xs text-slate-400 uppercase">Course / Program</span>
             <span className="block text-lg font-bold text-blue-900 mt-1">{courseName}</span>
          </div>
           <div className="text-center">
             <span className="block text-xs text-slate-400 uppercase">Completion Date</span>
             <span className="block text-lg font-bold text-blue-900 mt-1">{formattedDate}</span>
          </div>
       </div>
    </div>

    {/* Footer */}
    <div className="mt-auto flex justify-between items-end px-8">
       {/* Left: QR */}
       <div className="flex items-center gap-3">
         <img src={qrUrl} className="w-16 h-16 border border-slate-200" alt="QR" crossOrigin="anonymous"/>
         <div className="text-xs text-slate-400 max-w-[150px]">Scan code to verify authenticity.</div>
       </div>

       {/* Right: Seal & Signature */}
       <div className="flex items-end gap-6">
           {settings.institute.seal && (
               <img src={settings.institute.seal} className="h-24 w-24 object-contain opacity-80 mb-2" alt="Seal" />
           )}
           <div className="text-center">
              <div className="h-24 mb-4 flex justify-center items-end">
                 {settings.institute.signature ? <img src={settings.institute.signature} className="h-full object-contain" alt="Sig"/> : <span className="font-signature text-3xl">Signed</span>}
              </div>
              <div className="w-48 h-px bg-slate-400"></div>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Authorized Signatory</p>
           </div>
       </div>
    </div>
    <div className="absolute bottom-0 left-0 w-full h-3 bg-slate-800"></div>
  </div>
);

// --- 4. ELEGANT GOLD ---
export const ElegantTemplate: React.FC<TemplateProps> = ({ settings, data, typeTitle, description, formattedDate, qrUrl, orientation }) => (
  <div className="w-full h-full bg-[#FCFAF7] p-6 relative flex items-center justify-center">
     {/* Borders */}
     <div className="absolute inset-4 border border-gold-300"></div>
     <div className="absolute inset-6 border-[4px] border-double border-gold-500"></div>
     
     {/* Top Right Group: Cert No & Badge */}
     <div className="absolute top-10 right-10 z-20 flex flex-col items-end">
        <div className="text-xs font-serif text-gold-800 font-bold mb-2">No: {data.certificateNo}</div>
        {settings.institute.badge && (
            <img src={settings.institute.badge} className="h-20 w-20 object-contain opacity-90" alt="Badge" />
        )}
     </div>

     <div className="relative z-10 w-full text-center px-12 py-8 flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex flex-col items-center mx-auto mt-4">
           {settings.institute.logo && (
             <img src={settings.institute.logo} className="h-24 w-auto object-contain mb-4" alt="Logo"/>
           )}
           <h1 className="text-5xl font-signature text-gold-600 mb-1 leading-tight">{settings.institute.name}</h1>
           <p className="text-xs text-gold-800 uppercase tracking-widest">Excellence in Education</p>
        </div>

        {/* Body */}
        <div className="my-2">
            <h2 className="text-3xl font-serif font-bold text-slate-800 uppercase tracking-widest mb-6 border-b border-gold-200 inline-block pb-2">
            {typeTitle}
            </h2>

            <p className="font-serif italic text-slate-500 text-lg mb-2">Proudly presented to</p>
            
            <h3 className="text-5xl font-signature text-navy-900 mb-4 px-4">{data.studentName}</h3>
            
            <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent mb-6"></div>

            <p className="text-lg font-serif text-slate-700 leading-8 max-w-4xl mx-auto mb-2 text-justify">
            {description}
            </p>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end max-w-5xl mx-auto w-full px-4 pb-2">
           {/* Date */}
           <div className="text-center w-1/4">
              <div className="text-xl font-serif text-slate-800 border-b border-slate-300 pb-1 px-4 mb-2">{formattedDate}</div>
              <p className="text-xs text-gold-600 uppercase font-bold tracking-wider">Date</p>
           </div>

           {/* QR */}
           <div className="mb-2 w-1/4 flex justify-center">
             <img src={qrUrl} className="h-16 w-16 opacity-70 border border-gold-200 p-1" alt="QR" />
           </div>

           {/* Signature & Seal Area */}
           <div className="w-1/2 flex items-end justify-end gap-4">
              {/* Seal near signature */}
              {settings.institute.seal && (
                 <img src={settings.institute.seal} className="h-24 w-24 opacity-80 mb-2" alt="Seal"/>
              )}
              
              <div className="text-center min-w-[150px]">
                  <div className="h-28 flex items-end justify-center mb-2">
                     {settings.institute.signature ? <img src={settings.institute.signature} className="h-full object-contain" alt="Sig"/> : <span className="font-signature text-3xl">Signature</span>}
                  </div>
                  <div className="w-full h-px bg-slate-300 mb-1"></div>
                  <p className="text-xs text-gold-600 uppercase font-bold tracking-wider">Signature</p>
              </div>
           </div>
        </div>
     </div>
  </div>
);

// --- 6. TECH MODERN ---
export const TechTemplate: React.FC<TemplateProps> = ({ settings, data, typeTitle, description, formattedDate, qrUrl, orientation }) => (
  <div className="w-full h-full bg-slate-900 text-white relative p-12 overflow-hidden flex flex-col">
     {/* Geometric BG */}
     <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[100px] opacity-20"></div>
     <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500 rounded-full blur-[80px] opacity-10"></div>

     {/* Top Right Group: Cert No & Badge */}
     <div className="absolute top-8 right-8 z-30 flex flex-col items-end">
        <div className="text-xs font-mono text-slate-400 mb-2">CERTIFICATE NO: {data.certificateNo}</div>
        {settings.institute.badge && (
            <img src={settings.institute.badge} className="h-20 w-20 object-contain opacity-80 invert" alt="Badge" />
        )}
     </div>
     
     <div className="relative z-10 w-full h-full border border-slate-700 bg-slate-900/50 backdrop-blur-sm p-8 flex flex-col items-center text-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              {settings.institute.logo && <img src={settings.institute.logo} className="h-16 bg-white rounded p-1" alt="Logo"/>}
              <div className="text-left">
                 <div className="font-bold text-cyan-400 tracking-wider">VERIFIED CREDENTIAL</div>
                 <div className="text-xs text-slate-400">{settings.institute.website}</div>
              </div>
            </div>
            {/* Old Cert No removed from here */}
        </div>

        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mb-6">
           {typeTitle}
        </h1>
        
        <p className="text-slate-400 uppercase tracking-widest text-sm mb-4">Presented To</p>
        <h2 className="text-5xl font-bold text-white mb-2">{data.studentName}</h2>
        <p className="text-slate-400 mb-8">S/O {data.fatherName}</p>

        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 max-w-5xl mb-8 flex-1">
           <p className="text-xl text-slate-200 leading-relaxed text-justify">
             {description}
           </p>
           {/* Old Seal/Badge removed from here */}
        </div>

        <div className="mt-auto w-full grid grid-cols-3 gap-8 items-end">
           {/* QR */}
           <div className="text-left">
              <img src={qrUrl} className="w-20 h-20 bg-white p-2 rounded-lg" alt="QR"/>
              <p className="mt-2 text-xs text-slate-500">Scan to Verify</p>
           </div>
           
           {/* Date */}
           <div className="text-center">
              <div className="text-2xl font-bold text-white">{formattedDate}</div>
              <p className="text-xs text-cyan-500 uppercase font-bold tracking-widest mt-1">Date of Issue</p>
           </div>

           {/* Signature & Seal */}
           <div className="text-right flex items-end justify-end gap-4">
              {settings.institute.seal && <img src={settings.institute.seal} className="h-20 w-20 opacity-60 invert mb-2" alt="Seal"/>}
              
              <div className="flex flex-col items-end">
                  <div className="h-24 mb-2">
                     {settings.institute.signature ? <img src={settings.institute.signature} className="h-full invert" alt="Sig"/> : <span className="font-signature text-2xl text-white">Signed</span>}
                  </div>
                  <div className="w-40 h-px bg-slate-600"></div>
                  <p className="text-xs text-cyan-500 uppercase font-bold tracking-widest mt-1">Authority</p>
              </div>
           </div>
        </div>
     </div>
  </div>
);

// --- 7. ARTISTIC INK ---
export const ArtisticTemplate: React.FC<TemplateProps> = ({ settings, data, typeTitle, description, formattedDate, qrUrl, orientation }) => (
  <div className="w-full h-full bg-[#fdfbf7] p-10 flex flex-col items-center justify-center relative">
     {/* Decorative borders */}
     <div className="absolute top-8 left-8 w-32 h-32 border-t-2 border-l-2 border-rose-900 opacity-20"></div>
     <div className="absolute bottom-8 right-8 w-32 h-32 border-b-2 border-r-2 border-rose-900 opacity-20"></div>
     
     {/* Top Right Group: Cert No & Badge */}
     <div className="absolute top-8 right-8 z-20 flex flex-col items-end">
         <div className="text-xs text-rose-800 font-mono mb-2">No: {data.certificateNo}</div>
         {settings.institute.badge && (
             <img src={settings.institute.badge} className="h-20 w-20 object-contain opacity-80" alt="Badge" />
         )}
     </div>
     
     <div className="text-center relative z-10 max-w-5xl h-full flex flex-col justify-between py-6">
         <div>
            {settings.institute.logo && <img src={settings.institute.logo} className="h-24 mx-auto mb-6" alt="Logo"/>}
            <h1 className="text-2xl font-serif italic text-rose-900 mb-2">{settings.institute.name}</h1>
            <div className="w-16 h-1 bg-rose-200 mx-auto mb-8"></div>

            <h2 className="text-5xl font-official font-bold text-slate-800 mb-6">{typeTitle}</h2>
            
            <p className="text-xl text-slate-500 font-serif mb-2">This award is presented to</p>
            <h3 className="text-6xl font-signature text-rose-600 mb-2 p-2">{data.studentName}</h3>
         </div>
         
         <p className="text-lg text-slate-600 leading-relaxed font-serif italic mb-6 px-8 text-justify">
           "{description}"
         </p>

         {/* Removed Center Seal/Badge */}

         <div className="flex justify-between items-end w-full border-t border-rose-100 pt-8 px-12">
            <div className="text-center">
               <div className="text-xl font-bold text-slate-800">{formattedDate}</div>
               <div className="text-xs text-rose-400 uppercase tracking-widest mt-1">Date</div>
            </div>
            
            <div>
               <img src={qrUrl} className="h-16 w-16 opacity-70" alt="QR"/>
            </div>

            <div className="flex items-end gap-4">
               {settings.institute.seal && <img src={settings.institute.seal} className="h-20 w-20 opacity-80 mb-2" alt="seal"/>}
               
               <div className="text-center">
                   <div className="h-24 mb-2 flex justify-center items-end">
                     {settings.institute.signature ? <img src={settings.institute.signature} className="h-full" alt="Sig"/> : <span className="font-signature text-3xl">Signature</span>}
                   </div>
                   <div className="w-40 h-px bg-slate-800"></div>
                   <div className="text-xs text-rose-400 uppercase tracking-widest mt-1">Signature</div>
               </div>
            </div>
         </div>
     </div>
  </div>
);