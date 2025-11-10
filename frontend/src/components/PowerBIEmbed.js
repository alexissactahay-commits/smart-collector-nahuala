import React, { useEffect, useRef } from 'react';
import { models, Report } from 'powerbi-client';

const PowerBIEmbed = ({ reportId, embedUrl, accessToken }) => {
  const reportRef = useRef(null);

  useEffect(() => {
    if (!reportId || !embedUrl || !accessToken) {
      console.error('Faltan parámetros para embeber Power BI');
      return;
    }

    const config = {
      type: 'report',
      tokenType: models.TokenType.Embed,
      accessToken: accessToken,
      embedUrl: embedUrl,
      id: reportId,
      permissions: models.Permissions.All,
      settings: {
        filterPaneEnabled: true,
        navContentPaneEnabled: true,
        layoutType: models.LayoutType.Custom,
        customLayout: {
          displayOption: models.DisplayOption.FitToPage,
        },
      },
    };

    const report = Report.load(reportRef.current, config);

    report.then((report) => {
      report.on('loaded', () => {
        console.log('Reporte de Power BI cargado');
      });

      report.on('error', (event) => {
        console.error('Error en Power BI:', event.detail);
      });

      report.setPage('ReportSection'); // Opcional: Cargar una página específica
    });

    return () => {
      // Limpieza al desmontar el componente
      if (reportRef.current) {
        reportRef.current.innerHTML = '';
      }
    };
  }, [reportId, embedUrl, accessToken]);

  return (
    <div
      ref={reportRef}
      style={{
        height: '600px',
        width: '100%',
        border: '1px solid #ccc',
        borderRadius: '8px',
      }}
    />
  );
};

export default PowerBIEmbed;