import * as XLSX from 'xlsx';

/**
 * Downloadable templates for Special Questions (Accounting Large & MI/Tax Scenarios)
 * Uses documentation/guidance placeholder rows clearly marked as [EXAMPLE]
 */

export const ACCOUNTING_CSV_TEMPLATE = `Question ID,Subject,Chapter,Title,Question,Supporting Information,Field ID,Field Label,Field Instruction,Correct Value,Field Marks,Total Marks,Status
[EXAMPLE-ACC-01],Accounting,[Replace with valid Chapter Name],[Example Title] Year-End Accounting Adjustments,[Example Prompt] Calculate the closing inventory and gross profit for the period.,[Example Data] Sales: 250000; Opening Stock: 40000; Purchases: 150000; Operating Expenses: 30000.,closing_inventory,Closing Inventory,Enter final closing inventory valuation,45000,4,20,active
[EXAMPLE-ACC-01],Accounting,[Replace with valid Chapter Name],[Example Title] Year-End Accounting Adjustments,[Example Prompt] Calculate the closing inventory and gross profit for the period.,[Example Data] Sales: 250000; Opening Stock: 40000; Purchases: 150000; Operating Expenses: 30000.,cost_of_sales,Cost of Sales,Cost of goods sold calculation,145000,4,20,active
[EXAMPLE-ACC-01],Accounting,[Replace with valid Chapter Name],[Example Title] Year-End Accounting Adjustments,[Example Prompt] Calculate the closing inventory and gross profit for the period.,[Example Data] Sales: 250000; Opening Stock: 40000; Purchases: 150000; Operating Expenses: 30000.,gross_profit,Gross Profit,Revenue minus cost of goods sold,105000,4,20,active
[EXAMPLE-ACC-01],Accounting,[Replace with valid Chapter Name],[Example Title] Year-End Accounting Adjustments,[Example Prompt] Calculate the closing inventory and gross profit for the period.,[Example Data] Sales: 250000; Opening Stock: 40000; Purchases: 150000; Operating Expenses: 30000.,operating_expenses,Operating Expenses,Total administrative and selling expenses,30000,4,20,active
[EXAMPLE-ACC-01],Accounting,[Replace with valid Chapter Name],[Example Title] Year-End Accounting Adjustments,[Example Prompt] Calculate the closing inventory and gross profit for the period.,[Example Data] Sales: 250000; Opening Stock: 40000; Purchases: 150000; Operating Expenses: 30000.,net_profit,Net Profit,Gross profit minus operating expenses,75000,4,20,active
`;

export function getScenarioCsvTemplate(subjectName: 'Management Information' | 'Taxation'): string {
  const prefix = subjectName === 'Management Information' ? 'MI' : 'TAX';
  return `Scenario ID,Subject,Chapter,Scenario Title,Scenario Narrative,Task Number,Task Question,Option A,Option B,Option C,Option D,Correct Answer,Marks,Explanation,Status
[EXAMPLE-${prefix}-01],${subjectName},[Replace with valid Chapter Name],[Example Title] Case Study Background,[Example Narrative] Background case information and financial data provided here for all 7 tasks...,1,[Example Task 1] What is the primary variance?,Favourable,Adverse,Neutral,None,A,3,Detailed solution explanation here,active
[EXAMPLE-${prefix}-01],${subjectName},[Replace with valid Chapter Name],[Example Title] Case Study Background,[Example Narrative] Background case information and financial data provided here for all 7 tasks...,2,[Example Task 2] Calculate direct labor efficiency.,Option A text,Option B text,Option C text,Option D text,B,2,Detailed solution explanation here,active
[EXAMPLE-${prefix}-01],${subjectName},[Replace with valid Chapter Name],[Example Title] Case Study Background,[Example Narrative] Background case information and financial data provided here for all 7 tasks...,3,[Example Task 3] Determine overhead absorption rate.,Option A text,Option B text,Option C text,Option D text,C,2,Detailed solution explanation here,active
[EXAMPLE-${prefix}-01],${subjectName},[Replace with valid Chapter Name],[Example Title] Case Study Background,[Example Narrative] Background case information and financial data provided here for all 7 tasks...,4,[Example Task 4] What is the fixed budget cost?,Option A text,Option B text,Option C text,Option D text,D,2,Detailed solution explanation here,active
[EXAMPLE-${prefix}-01],${subjectName},[Replace with valid Chapter Name],[Example Title] Case Study Background,[Example Narrative] Background case information and financial data provided here for all 7 tasks...,5,[Example Task 5] Evaluate the contribution margin ratio.,Option A text,Option B text,Option C text,Option D text,A,2,Detailed solution explanation here,active
[EXAMPLE-${prefix}-01],${subjectName},[Replace with valid Chapter Name],[Example Title] Case Study Background,[Example Narrative] Background case information and financial data provided here for all 7 tasks...,6,[Example Task 6] Calculate break-even revenue in BDT.,Option A text,Option B text,Option C text,Option D text,B,2,Detailed solution explanation here,active
[EXAMPLE-${prefix}-01],${subjectName},[Replace with valid Chapter Name],[Example Title] Case Study Background,[Example Narrative] Background case information and financial data provided here for all 7 tasks...,7,[Example Task 7] Recommend optimal production mix.,Option A text,Option B text,Option C text,Option D text,C,2,Detailed solution explanation here,active
`;
}

export const ACCOUNTING_JSON_TEMPLATE = [
  {
    type: 'accounting_large',
    question_id: '[EXAMPLE-ACC-01]',
    subject: 'Accounting',
    chapter: '[Replace with valid Chapter Name]',
    title: '[Example Title] Year-End Accounting Adjustments',
    question: '[Example Prompt] Calculate the financial statement figures based on the trial balance data.',
    supporting_information: '[Example Data] Sales: 250,000; Opening Inventory: 40,000; Purchases: 150,000; Operating Expenses: 30,000.',
    fields: [
      {
        id: 'closing_inventory',
        label: 'Closing Inventory',
        instruction: 'Enter final closing inventory valuation',
        correct_value: '45000',
        marks: 4
      },
      {
        id: 'cost_of_sales',
        label: 'Cost of Sales',
        instruction: 'Cost of goods sold calculation',
        correct_value: '145000',
        marks: 4
      },
      {
        id: 'gross_profit',
        label: 'Gross Profit',
        instruction: 'Revenue minus cost of goods sold',
        correct_value: '105000',
        marks: 4
      },
      {
        id: 'operating_expenses',
        label: 'Operating Expenses',
        instruction: 'Total administrative and selling expenses',
        correct_value: '30000',
        marks: 4
      },
      {
        id: 'net_profit',
        label: 'Net Profit',
        instruction: 'Gross profit minus operating expenses',
        correct_value: '75000',
        marks: 4
      }
    ],
    total_marks: 20,
    status: 'active'
  }
];

export function getScenarioJsonTemplate(subjectName: 'Management Information' | 'Taxation') {
  const prefix = subjectName === 'Management Information' ? 'MI' : 'TAX';
  return [
    {
      type: 'scenario',
      scenario_id: `[EXAMPLE-${prefix}-01]`,
      subject: subjectName,
      chapter: '[Replace with valid Chapter Name]',
      title: '[Example Title] Case Study Background',
      narrative: '[Example Narrative] Detailed narrative, financial statements, or context for the case study...',
      tasks: [
        {
          task_number: 1,
          question: '[Example Task 1] What is the primary variance?',
          options: { A: 'Option A text', B: 'Option B text', C: 'Option C text', D: 'Option D text' },
          correct_answer: 'A',
          marks: 3,
          explanation: 'Detailed solution explanation here'
        },
        {
          task_number: 2,
          question: '[Example Task 2] Calculate direct labor efficiency.',
          options: { A: 'Option A text', B: 'Option B text', C: 'Option C text', D: 'Option D text' },
          correct_answer: 'B',
          marks: 2,
          explanation: 'Detailed solution explanation here'
        },
        {
          task_number: 3,
          question: '[Example Task 3] Determine overhead absorption rate.',
          options: { A: 'Option A text', B: 'Option B text', C: 'Option C text', D: 'Option D text' },
          correct_answer: 'C',
          marks: 2,
          explanation: 'Detailed solution explanation here'
        },
        {
          task_number: 4,
          question: '[Example Task 4] What is the fixed budget cost?',
          options: { A: 'Option A text', B: 'Option B text', C: 'Option C text', D: 'Option D text' },
          correct_answer: 'D',
          marks: 2,
          explanation: 'Detailed solution explanation here'
        },
        {
          task_number: 5,
          question: '[Example Task 5] Evaluate the contribution margin ratio.',
          options: { A: 'Option A text', B: 'Option B text', C: 'Option C text', D: 'Option D text' },
          correct_answer: 'A',
          marks: 2,
          explanation: 'Detailed solution explanation here'
        },
        {
          task_number: 6,
          question: '[Example Task 6] Calculate break-even revenue in BDT.',
          options: { A: 'Option A text', B: 'Option B text', C: 'Option C text', D: 'Option D text' },
          correct_answer: 'B',
          marks: 2,
          explanation: 'Detailed solution explanation here'
        },
        {
          task_number: 7,
          question: '[Example Task 7] Recommend optimal production mix.',
          options: { A: 'Option A text', B: 'Option B text', C: 'Option C text', D: 'Option D text' },
          correct_answer: 'C',
          marks: 2,
          explanation: 'Detailed solution explanation here'
        }
      ],
      total_marks: 15,
      status: 'active'
    }
  ];
}

/**
 * Generates an XLSX Blob from a CSV string template
 */
export function generateXlsxFromCsv(csvContent: string): Uint8Array {
  const workbook = XLSX.read(csvContent, { type: 'string' });
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}
