const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Generar reporte de asistencia
router.get('/attendance', async (req, res) => {
  const { format, from, to, category, player_id } = req.query;
  const db = getDb();

  // Construir query base
  let query = `
    SELECT 
      p.id as player_id,
      p.name,
      p.last_name,
      p.category,
      p.position,
      ts.date,
      t.name as training_name,
      a.attended,
      a.absence_reason
    FROM attendance a
    JOIN players p ON a.player_id = p.id
    JOIN training_sessions ts ON a.session_id = ts.id
    LEFT JOIN trainings t ON ts.training_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (from) {
    query += ' AND ts.date >= ?';
    params.push(from);
  }

  if (to) {
    query += ' AND ts.date <= ?';
    params.push(to);
  }

  if (category) {
    query += ' AND p.category = ?';
    params.push(category);
  }

  if (player_id) {
    query += ' AND p.id = ?';
    params.push(player_id);
  }

  query += ' ORDER BY p.last_name, p.name, ts.date';

  const data = db.prepare(query).all(...params);

  // Calcular estadísticas por jugador
  const playerStats = {};
  data.forEach(row => {
    if (!playerStats[row.player_id]) {
      playerStats[row.player_id] = {
        name: row.name,
        last_name: row.last_name,
        category: row.category,
        position: row.position,
        total: 0,
        attended: 0,
        absences: []
      };
    }
    playerStats[row.player_id].total++;
    if (row.attended) {
      playerStats[row.player_id].attended++;
    } else {
      playerStats[row.player_id].absences.push({
        date: row.date,
        reason: row.absence_reason || 'Sin motivo'
      });
    }
  });

  // Convertir a array y calcular porcentajes
  const statsArray = Object.values(playerStats).map(p => ({
    ...p,
    missed: p.total - p.attended,
    attendance_rate: p.total > 0 ? ((p.attended / p.total) * 100).toFixed(1) : '0.0'
  }));

  if (format === 'pdf') {
    await generatePDF(res, statsArray, { from, to, category });
  } else if (format === 'excel') {
    await generateExcel(res, statsArray, data, { from, to, category });
  } else {
    res.json({
      summary: statsArray,
      details: data,
      period: { from, to },
      filters: { category, player_id }
    });
  }
});

// Generar PDF
async function generatePDF(res, stats, filters) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=asistencia_${new Date().toISOString().split('T')[0]}.pdf`);

  doc.pipe(res);

  // Título
  doc.fontSize(20).fillColor('#1e40af').text('VoleyAssistant', { align: 'center' });
  doc.fontSize(16).fillColor('#000').text('Reporte de Asistencia', { align: 'center' });
  doc.moveDown();

  // Período
  if (filters.from || filters.to) {
    doc.fontSize(10).text(`Período: ${filters.from || 'Inicio'} - ${filters.to || 'Actual'}`, { align: 'center' });
  }
  if (filters.category) {
    doc.text(`Categoría: ${filters.category}`, { align: 'center' });
  }
  doc.moveDown(2);

  // Tabla de resumen
  doc.fontSize(14).fillColor('#1e40af').text('Resumen por Jugador', { underline: true });
  doc.moveDown();

  const tableTop = doc.y;
  const colWidths = [150, 70, 60, 60, 60, 80];
  const headers = ['Jugador', 'Categoría', 'Total', 'Asistió', 'Faltó', '% Asistencia'];

  // Header
  doc.fontSize(10).fillColor('#fff');
  doc.rect(50, tableTop, 480, 20).fill('#1e40af');
  let x = 50;
  headers.forEach((header, i) => {
    doc.fillColor('#fff').text(header, x + 5, tableTop + 5, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });

  // Rows
  let y = tableTop + 25;
  doc.fillColor('#000');

  stats.forEach((player, index) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    const bgColor = index % 2 === 0 ? '#f3f4f6' : '#fff';
    doc.rect(50, y - 5, 480, 20).fill(bgColor);

    x = 50;
    doc.fillColor('#000').fontSize(9);
    doc.text(`${player.last_name}, ${player.name}`, x + 5, y, { width: colWidths[0] - 10 });
    doc.text(player.category, x + colWidths[0] + 5, y, { width: colWidths[1] - 10 });
    doc.text(player.total.toString(), x + colWidths[0] + colWidths[1] + 5, y, { width: colWidths[2] - 10 });
    doc.text(player.attended.toString(), x + colWidths[0] + colWidths[1] + colWidths[2] + 5, y, { width: colWidths[3] - 10 });
    doc.text(player.missed.toString(), x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, y, { width: colWidths[4] - 10 });
    doc.text(`${player.attendance_rate}%`, x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, y, { width: colWidths[5] - 10 });

    y += 20;
  });

  // Detalle de ausencias
  doc.addPage();
  doc.fontSize(14).fillColor('#1e40af').text('Detalle de Ausencias', { underline: true });
  doc.moveDown();

  y = doc.y;
  stats.forEach(player => {
    if (player.absences.length > 0) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(11).fillColor('#1e40af').text(`${player.last_name}, ${player.name}`, 50, y);
      y += 15;

      player.absences.forEach(absence => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.fontSize(9).fillColor('#000').text(`• ${absence.date}: ${absence.reason}`, 70, y);
        y += 12;
      });

      y += 10;
    }
  });

  // Footer
  doc.fontSize(8).fillColor('#666').text(
    `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
    50,
    doc.page.height - 50,
    { align: 'center' }
  );

  doc.end();
}

// Generar Excel
async function generateExcel(res, stats, details, filters) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VoleyAssistant';
  workbook.created = new Date();

  // Hoja de resumen
  const summarySheet = workbook.addWorksheet('Resumen');
  
  // Estilo del header
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  summarySheet.columns = [
    { header: 'Apellidos', key: 'last_name', width: 20 },
    { header: 'Nombre', key: 'name', width: 15 },
    { header: 'Categoría', key: 'category', width: 12 },
    { header: 'Posición', key: 'position', width: 12 },
    { header: 'Total Entrenamientos', key: 'total', width: 18 },
    { header: 'Asistió', key: 'attended', width: 10 },
    { header: 'Faltó', key: 'missed', width: 10 },
    { header: '% Asistencia', key: 'attendance_rate', width: 14 }
  ];

  // Aplicar estilo al header
  summarySheet.getRow(1).eachCell(cell => {
    cell.style = headerStyle;
  });

  // Agregar datos
  stats.forEach(player => {
    summarySheet.addRow({
      last_name: player.last_name,
      name: player.name,
      category: player.category,
      position: player.position || '-',
      total: player.total,
      attended: player.attended,
      missed: player.missed,
      attendance_rate: parseFloat(player.attendance_rate)
    });
  });

  // Formato de porcentaje
  summarySheet.getColumn('attendance_rate').eachCell((cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.numFmt = '0.0"%"';
    }
  });

  // Hoja de detalle
  const detailSheet = workbook.addWorksheet('Detalle');
  
  detailSheet.columns = [
    { header: 'Fecha', key: 'date', width: 12 },
    { header: 'Entrenamiento', key: 'training_name', width: 15 },
    { header: 'Apellidos', key: 'last_name', width: 18 },
    { header: 'Nombre', key: 'name', width: 15 },
    { header: 'Categoría', key: 'category', width: 12 },
    { header: 'Asistió', key: 'attended', width: 10 },
    { header: 'Motivo Ausencia', key: 'absence_reason', width: 30 }
  ];

  detailSheet.getRow(1).eachCell(cell => {
    cell.style = headerStyle;
  });

  details.forEach(row => {
    detailSheet.addRow({
      date: row.date,
      training_name: row.training_name || '-',
      last_name: row.last_name,
      name: row.name,
      category: row.category,
      attended: row.attended ? 'Sí' : 'No',
      absence_reason: row.absence_reason || '-'
    });
  });

  // Hoja de ausencias
  const absencesSheet = workbook.addWorksheet('Ausencias');
  
  absencesSheet.columns = [
    { header: 'Apellidos', key: 'last_name', width: 18 },
    { header: 'Nombre', key: 'name', width: 15 },
    { header: 'Fecha', key: 'date', width: 12 },
    { header: 'Motivo', key: 'reason', width: 40 }
  ];

  absencesSheet.getRow(1).eachCell(cell => {
    cell.style = headerStyle;
  });

  stats.forEach(player => {
    player.absences.forEach(absence => {
      absencesSheet.addRow({
        last_name: player.last_name,
        name: player.name,
        date: absence.date,
        reason: absence.reason
      });
    });
  });

  // Enviar archivo
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=asistencia_${new Date().toISOString().split('T')[0]}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = router;
