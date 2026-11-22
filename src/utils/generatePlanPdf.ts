import { jsPDF } from 'jspdf';
import type { ValidatedFitnessPlan } from '../schemas/fitnessPlanResponseSchema';

export function downloadPlanPdf(plan: ValidatedFitnessPlan): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
      drawPageFooter();
    }
  };

  const drawPageFooter = () => {
    const origFontSize = doc.getFontSize();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'ROAR EXTREME • 6th Floor Terrace, Rushiraj Regency, Vidya Vikas Circle, Nashik • Official Fitness Protocol',
      margin,
      pageHeight - 8
    );
    doc.text(
      `Page ${doc.getNumberOfPages()}`,
      pageWidth - margin - 12,
      pageHeight - 8
    );
    doc.setFontSize(origFontSize);
  };

  // 1. Header Banner
  doc.setFillColor(8, 8, 8); // #080808
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Orange accent bar (#FF5A1F)
  doc.setFillColor(255, 90, 31);
  doc.rect(0, 26.5, pageWidth, 1.5, 'F');

  // Title
  doc.setTextColor(255, 90, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ROAR EXTREME', margin, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('PERSONALIZED ATHLETIC WORKOUT & INDIAN NUTRITION PROTOCOL', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  const planIdText = `PLAN ID: ${plan.planId || 'ROAR-CUSTOM'}  •  DATE: ${new Date().toLocaleDateString('en-IN')}`;
  doc.text(planIdText, margin, 23);

  y = 35;
  drawPageFooter();

  // 2. Member Targets Overview Card
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 90, 31);
  doc.text('CALCULATED CLINICAL TARGETS (Mifflin-St Jeor & IFCT 2017)', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(`${plan.targets?.dailyCalories || plan.targets?.targetCalories || 2200} kcal/day`, margin + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  const protein = plan.targets?.macros?.protein?.grams || 120;
  const carbs = plan.targets?.macros?.carbohydrates?.grams || plan.targets?.macros?.carbs?.grams || 250;
  const fats = plan.targets?.macros?.fat?.grams || plan.targets?.macros?.fats?.grams || 60;
  const bmr = plan.targets?.bmr || 1600;
  const tdee = plan.targets?.tdee || 2200;
  const bmiStr = plan.bmi?.bmi ? `BMI: ${plan.bmi.bmi} (${plan.bmi.band || 'Normal'})` : '';

  doc.text(`Protein: ${protein}g   |   Carbs: ${carbs}g   |   Fats: ${fats}g`, margin + 4, y + 20);
  doc.text(`BMR: ${bmr} kcal   •   TDEE: ${tdee} kcal   ${bmiStr ? '•   ' + bmiStr : ''}`, margin + 85, y + 20);

  y += 31;

  // 3. Weekly Workout Split
  checkPageBreak(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(`WORKOUT ROUTINE: ${plan.workoutPlan?.splitName || 'Targeted Conditioning Split'}`, margin, y);

  y += 5;

  const schedule = plan.workoutPlan?.weeklySchedule || {};
  const dayKeys = Object.keys(schedule);

  if (dayKeys.length > 0) {
    dayKeys.forEach((key, dayIdx) => {
      const day = schedule[key];
      checkPageBreak(25 + (day.exercises?.length || 0) * 6);

      // Day Header Pill
      doc.setFillColor(235, 235, 235);
      doc.rect(margin, y, pageWidth - 2 * margin, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 90, 31);
      doc.text(day.title || `Day ${dayIdx + 1}`, margin + 2.5, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      if (day.focus) {
        doc.text(`Focus: ${day.focus}`, margin + 45, y + 4.5);
      }

      y += 9;

      // Table Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text('EXERCISE', margin + 2, y);
      doc.text('SETS', margin + 70, y);
      doc.text('REPS', margin + 85, y);
      doc.text('COACHING CUE & TECHNIQUE', margin + 105, y);
      y += 3;

      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3.5;

      // Exercise Rows
      if (day.exercises && day.exercises.length > 0) {
        day.exercises.forEach((ex) => {
          checkPageBreak(6);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(30, 30, 30);
          doc.text(ex.name || 'Exercise', margin + 2, y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(String(ex.sets || 3), margin + 70, y);
          doc.text(String(ex.reps || '8-12'), margin + 85, y);

          doc.setFontSize(7.5);
          doc.setTextColor(110, 110, 110);
          const cue = ex.coachingCue ? doc.splitTextToSize(ex.coachingCue, 70)[0] : 'Maintain strict form';
          doc.text(cue, margin + 105, y);

          y += 5.5;
        });
      } else if (day.recoveryNote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Active Recovery: ${day.recoveryNote}`, margin + 2, y);
        y += 5;
      }

      y += 4;
    });
  }

  // 4. Indian Diet & Nutrition Protocol
  checkPageBreak(30);
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  const dietTitle = (plan.dietPlan as any)?.title || (plan.dietPlan as any)?.goal || 'Personalized Indian Nutrition Blueprint';
  doc.text(`NUTRITION PLAN: ${dietTitle}`, margin, y);
  y += 6;

  const meals = plan.dietPlan?.meals || [];
  if (meals.length > 0) {
    meals.forEach((m) => {
      checkPageBreak(18 + (m.items?.length || 0) * 5.5);

      // Meal Header
      doc.setFillColor(242, 242, 242);
      doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 90, 31);
      doc.text(m.name || 'Meal', margin + 2.5, y + 4.2);
      y += 8;

      if (m.items && m.items.length > 0) {
        m.items.forEach((item) => {
          checkPageBreak(5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(40, 40, 40);
          doc.text(`• ${item.item}`, margin + 4, y);

          doc.setFontSize(7.5);
          doc.setTextColor(100, 100, 100);
          doc.text(`${item.quantity}   (${item.protein}g protein, ${item.kcal} kcal)`, margin + 90, y);
          y += 4.8;
        });
      }
      y += 2.5;
    });
  }

  // 5. Progression & Warmup Rules
  checkPageBreak(25);
  y += 3;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 90, 31);
  doc.text('DOUBLE PROGRESSION & WARMUP RULES', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  const progRule = plan.workoutPlan?.progressionRule || 'Add 1 rep or 1-2 kg each session when top rep range is completed with clean form.';
  const warmup = plan.workoutPlan?.warmup || '5-10 min dynamic mobility: leg swings, arm circles, band pull-aparts, light cardio warmup.';

  doc.text(`• Progression: ${doc.splitTextToSize(progRule, pageWidth - 2 * margin - 10)[0]}`, margin + 4, y + 10);
  doc.text(`• Warmup: ${doc.splitTextToSize(warmup, pageWidth - 2 * margin - 10)[0]}`, margin + 4, y + 15);

  y += 24;

  // Disclaimer
  checkPageBreak(12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  const disclaimerText = plan.disclaimer || 'This automated guidance is for physical conditioning purposes. Consult a certified health professional before starting.';
  doc.text(doc.splitTextToSize(disclaimerText, pageWidth - 2 * margin), margin, y);

  // Instantly trigger browser download! Zero preview delay!
  const filename = `ROAR_EXTREME_${(plan.planId || 'CUSTOM_PLAN').replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`;
  doc.save(filename);
}
