import React from 'react';
import { AppData, StudentCertificateData } from '../types';
import { 
  ClassicTemplate, 
  ModernTemplate, 
  CorporateTemplate, 
  ElegantTemplate, 
  TechTemplate,
  ArtisticTemplate
} from './CertificateTemplates';

interface CertificateProps {
  data: StudentCertificateData;
  settings: AppData;
  previewMode?: boolean;
}

const Certificate: React.FC<CertificateProps> = ({ data, settings }) => {
  const course = settings.courses.find(c => c.id === data.courseId);
  const duration = settings.durations.find(d => d.id === data.durationId);
  const type = settings.types.find(t => t.id === data.typeId);

  // Helper to format dates (en-GB for DD Month YYYY)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '___________';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper to process description placeholders
  const getDescription = () => {
    if (!type?.description) return '';
    let desc = type.description;
    desc = desc.replace(/{{student}}/g, data.studentName || 'Student Name');
    desc = desc.replace(/{{father}}/g, data.fatherName || 'Father Name');
    desc = desc.replace(/{{course}}/g, course?.name || 'Course Name');
    desc = desc.replace(/{{duration}}/g, duration?.label || 'Duration');
    desc = desc.replace(/{{certNo}}/g, data.certificateNo || 'Pending');
    desc = desc.replace(/{{startDate}}/g, formatDate(data.dateOfJoining));
    desc = desc.replace(/{{endDate}}/g, formatDate(data.dateOfCompletion));
    return desc;
  };

  // Common Props for all templates
  const templateProps = {
    data,
    settings,
    courseName: course?.name || "Course Name",
    durationLabel: duration?.label || "Duration",
    typeTitle: type?.templateTitle || "CERTIFICATE",
    description: getDescription(),
    formattedDate: formatDate(data.issueDate),
    orientation: data.orientation,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      `ID:${data.certificateNo}|${data.studentName}|${course?.name}|${data.issueDate}`
    )}`
  };

  // Dimensions based on orientation (A4 @ 96 DPI)
  const isPortrait = data.orientation === 'portrait';
  const width = isPortrait ? 'w-[794px]' : 'w-[1123px]';
  const height = isPortrait ? 'h-[1123px]' : 'h-[794px]';

  const containerClasses = `certificate-container relative ${width} ${height} mx-auto overflow-hidden shadow-2xl bg-white text-left box-border`;

  const renderTemplate = () => {
    switch (settings.activeTemplate) {
      case 'modern': return <ModernTemplate {...templateProps} />;
      case 'corporate': return <CorporateTemplate {...templateProps} />;
      case 'elegant': return <ElegantTemplate {...templateProps} />;
      case 'tech': return <TechTemplate {...templateProps} />;
      case 'artistic': return <ArtisticTemplate {...templateProps} />;
      case 'classic': default: return <ClassicTemplate {...templateProps} />;
    }
  };

  return (
    <div className={containerClasses}>
      {renderTemplate()}
    </div>
  );
};

export default Certificate;