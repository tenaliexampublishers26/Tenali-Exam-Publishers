export interface SyllabusTopic {
  title: string;
  items: string[];
  subtitle?: string;
}

export interface SyllabusSection {
  title: string;
  subtitle?: string;
  badge?: string;
  topics: SyllabusTopic[];
}

export interface CadreSyllabus {
  id: string;
  cadreName: string;
  shortTag: string;
  icon: string;
  focus: string;
  tags: string[];
  sections: SyllabusSection[];
}

export interface ProductSyllabusData {
  productSlug: string;
  productName: string;
  cadres: CadreSyllabus[];
}

export const SYLLABUS_DATABASE: Record<string, ProductSyllabusData> = {
  'mts-postman-mg': {
    productSlug: 'mts-postman-mg',
    productName: 'MTS + POSTMAN / MG (2-Book Preparation Set)',
    cadres: [
      {
        id: 'mts',
        cadreName: 'MTS (Multi Tasking Staff)',
        shortTag: 'MTS Syllabus',
        icon: 'book',
        focus: 'Postal Knowledge + General Knowledge + Mathematics',
        tags: [
          'Post Office Guide Part-I', 'Postal Rules', 'Post Offices', 'Postage & Stamps', 
          'Packing & Posting', 'Addressing', 'Post Boxes & Post Bags', 'Postal Articles', 
          'Postal Services', 'Banking & Remittances', 'Insurance', 'General Knowledge', 
          'Indian Geography', 'Civics', 'Indian Culture & Freedom Struggle', 'Ethics & Moral Studies', 
          'BODMAS', 'Percentage', 'Profit & Loss', 'Simple Interest', 'Average', 'Time & Work', 
          'Time & Distance', 'Unitary Method'
        ],
        sections: [
          {
            title: 'PART – A: Post Office Guide Part-I',
            badge: '23 Questions | 46 Marks',
            topics: [
              {
                title: 'Department Organization & Office Rules',
                items: [
                  '1. Organization of the Department',
                  '2. Types of Post Offices',
                  '3. Business Hours',
                  '4. Payment of Postage, Stamps & Stationery',
                  '5. General Rules regarding Packing, Sealing & Posting',
                  '6. Manner of Affixing Postage Stamps',
                  '7. Methods of Address',
                  '8. Post Boxes & Post Bags',
                  '9. Duties of Letter Box Peon',
                  '10. Official Postal Articles',
                  '11. Prohibited Postal Articles'
                ]
              },
              {
                title: '12. Postal Products & Services',
                items: [
                  'Mails & Mail Operations',
                  'Banking & Remittances (POSB / IPPB)',
                  'Postal Life Insurance (PLI & RPLI)',
                  'Stamps & General Postal Business'
                ]
              },
              {
                title: '13. Postal Rule Book Volume V',
                items: ['Volume V – Official Definitions & Postal Terminology']
              }
            ]
          },
          {
            title: 'PART – B: General Knowledge & Mathematics',
            badge: '20 MCQs | 40 Marks',
            topics: [
              {
                title: 'General Knowledge (10 MCQs | 20 Marks)',
                items: [
                  'Indian Geography',
                  'Civics & Constitution Fundamentals',
                  'General Knowledge & Current Affairs',
                  'Indian Culture & Heritage',
                  'Indian Freedom Struggle',
                  'Ethics & Moral Studies'
                ]
              },
              {
                title: 'Mathematics (10 MCQs | 20 Marks)',
                items: [
                  'BODMAS / Simplification',
                  'Percentage & Ratio',
                  'Profit & Loss',
                  'Simple Interest & Compound Concepts',
                  'Average',
                  'Time & Work',
                  'Time & Distance',
                  'Unitary Method'
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'postman',
        cadreName: 'POSTMAN',
        shortTag: 'Postman Syllabus',
        icon: 'mail',
        focus: 'Postal Knowledge + GK + Mathematics + Practical Postal Operations + Mail Delivery Procedures',
        tags: [
          'Post Office Guide Part-I', 'General Knowledge', 'Mathematics', 'Postal Operations', 
          'Mail Delivery', 'Refusal of Articles', 'e-Money Orders', 'Redirection', 'Address Change', 
          'Deceased Person Articles', 'Rural Postman Facilities', 'Postal Manual Volume VI Part III', 
          'Head Postman', 'Postal Business', 'Sale of Stamps', 'Postman\'s Book', 'Delivery Procedures', 
          'Registered & Insured Articles', 'e-MO Payments', 'Village Postman Duties', 
          'Postal Manual Volume VII', 'Stamps & Seals', 'Stationery', 'Mail Abstract', 
          'Exchange of Mails', 'Transit Bags', 'Mail Guard/Agent Duties', 'A & B Orders'
        ],
        sections: [
          {
            title: 'PART – A: Post Office Guide Part-I, GK & Mathematics',
            badge: '43 Questions | 86 Marks',
            topics: [
              {
                title: 'Post Office Guide Part-I (23 Questions | 46 Marks)',
                items: [
                  'Organization of the Department',
                  'Types of Post Offices & Business Hours',
                  'Payment of Postage, Stamps & Stationery',
                  'Packing, Sealing & Posting Rules',
                  'Affixing Postage Stamps & Methods of Address',
                  'Post Boxes & Post Bags',
                  'Duties of Letter Box Peon',
                  'Official & Prohibited Postal Articles',
                  'Postal Products & Services (Mails, Banking, PLI/RPLI, Stamps)',
                  'Postal Rule Book Volume V – Definitions'
                ]
              },
              {
                title: 'General Knowledge (10 MCQs | 20 Marks)',
                items: [
                  'Indian Geography & Civics',
                  'General Knowledge & Current Affairs',
                  'Indian Culture & Freedom Struggle',
                  'Ethics & Moral Studies'
                ]
              },
              {
                title: 'Mathematics (10 MCQs | 20 Marks)',
                items: [
                  'BODMAS, Percentage, Profit & Loss',
                  'Simple Interest, Average, Time & Work',
                  'Time & Distance, Unitary Method'
                ]
              }
            ]
          },
          {
            title: 'PAPER – II: Knowledge of Postal Operations',
            badge: '25 MCQs | 50 Marks | 30 Mins',
            subtitle: 'Compulsory Paper for Postman / Mail Guard Appointment',
            topics: [
              {
                title: 'Post Office Guide Part-I (Operations & Delivery)',
                items: [
                  'Delivery of Mails',
                  'Refusal of Article',
                  'Payment by e-Money Order',
                  'Redirection Procedures',
                  'Instructions Regarding Address Change',
                  'Articles Addressed to Deceased Persons',
                  'Liability to Detain Certain Mails',
                  'Facilities Provided by Postman in Rural Areas'
                ]
              },
              {
                title: 'Postal Manual Volume VI – Part III',
                items: [
                  'Head Postman Responsibilities',
                  'Knowledge of Postal Business & Supply of Forms',
                  'Sale of Stamps & Postman\'s Book Maintenance',
                  'Address to be Noted on Postal Articles',
                  'Handling Damaged Articles',
                  'Receipts for Articles Issued for Delivery',
                  'Receipts for Intimations & Notices',
                  'Instructions for Delivery & Realization of Postage Before Delivery',
                  'Receipts of Addresses for Registered Articles',
                  'Delivery to Illiterate Addressees & Pardanashin Women',
                  'Delivery of Insured Articles to Minors',
                  'Payment of e-Money Orders & Payment of e-MO to Minors',
                  'Payment of e-MO & Delivery of Registered Letters',
                  'Duties & Responsibilities of Village Postman'
                ]
              },
              {
                title: 'Postal Manual Volume VII',
                items: [
                  'Stamps & Seals Rules',
                  'Portfolio & Its Contents',
                  'Stationery & Preparation of Daily Report',
                  'Mail Abstract & Exchange of Mails',
                  'Cage TB & Disposal of Mails',
                  'Closing of Transit Bags',
                  'Duties & Responsibilities of Mail Guard/Agent',
                  'Final Duties Before Leaving Van or Office',
                  '“A” Order & “B” Order Directives'
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'mail-guard',
        cadreName: 'MAIL GUARD (MG)',
        shortTag: 'Mail Guard (MG) Syllabus',
        icon: 'package',
        focus: 'Postal Knowledge + GK + Mathematics + Mail Handling + Transit Mail Operations + Postal Manual Procedures',
        tags: [
          'Post Office Guide Part-I', 'General Knowledge', 'Mathematics', 'Postal Operations', 
          'Mail Handling', 'Delivery & Refusal of Articles', 'e-Money Orders', 'Redirection', 
          'Address Change', 'Postal Manual Volume VI Part III', 'Postal Business', 'Postman\'s Book', 
          'Delivery Procedures', 'Registered & Insured Articles', 'Postal Manual Volume VII', 
          'Stamps & Seals', 'Mail Abstract', 'Exchange of Mails', 'Transit Bags', 
          'Duties & Responsibilities of Mail Guard/Agent', 'Final Duties Before Leaving Van/Office', 'A & B Orders'
        ],
        sections: [
          {
            title: 'PART – A: Post Office Guide Part-I, GK & Mathematics',
            badge: '43 Questions | 86 Marks',
            topics: [
              {
                title: 'Post Office Guide Part-I (23 Questions | 46 Marks)',
                items: [
                  'Organization of the Department & Post Office Types',
                  'Business Hours, Postage Payment & Stationery',
                  'Packing, Sealing & Addressing Rules',
                  'Post Boxes, Post Bags & Letter Box Peon Duties',
                  'Official & Prohibited Postal Articles',
                  'Products & Services (Mails, Banking, PLI/RPLI)',
                  'Postal Rule Book Volume V – Definitions'
                ]
              },
              {
                title: 'General Knowledge & Mathematics (20 MCQs | 40 Marks)',
                items: [
                  'Geography, Civics, Freedom Struggle, Ethics & Moral Studies',
                  'BODMAS, Percentage, Profit & Loss, Simple Interest, Average, Time & Work, Time & Distance'
                ]
              }
            ]
          },
          {
            title: 'PAPER – II: Knowledge of Postal Operations',
            badge: '25 MCQs | 50 Marks | 30 Mins',
            subtitle: 'Transit Mail & Postal Operation Procedures',
            topics: [
              {
                title: 'Post Office Guide Part-I (Operations)',
                items: [
                  'Delivery of Mails & Refusal of Articles',
                  'Payment by e-Money Order & Redirection Rules',
                  'Address Change Instructions & Deceased Persons Articles',
                  'Liability to Detain Certain Mails',
                  'Rural Area Postman Facilities'
                ]
              },
              {
                title: 'Postal Manual Volume VI – Part III',
                items: [
                  'Head Postman & Postal Business Rules',
                  'Supply of Forms, Sale of Stamps & Postman\'s Book',
                  'Handling Damaged Articles & Delivery Receipts',
                  'Intimations, Notices & Realization of Postage',
                  'Registered & Insured Articles Delivery Rules',
                  'e-MO Payment to Minors & Addressees',
                  'Duties of Village Postman'
                ]
              },
              {
                title: 'Postal Manual Volume VII (Transit Mails & RMS)',
                items: [
                  'Stamps & Seals, Portfolio & Contents',
                  'Stationery & Daily Report Preparation',
                  'Mail Abstract & Exchange of Mails',
                  'Cage TB & Disposal of Mails',
                  'Closing of Transit Bags',
                  'Duties & Responsibilities of Mail Guard/Agent',
                  'Final Duties Before Leaving Van/Office',
                  '“A” Order & “B” Order Directives'
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  'pa-sa': {
    productSlug: 'pa-sa',
    productName: 'PA & SA (Postal Assistant & Sorting Assistant)',
    cadres: [
      {
        id: 'pa-sa-cadre',
        cadreName: 'PA & SA (Postal Assistant & Sorting Assistant)',
        shortTag: 'PA & SA Complete Syllabus',
        icon: 'file-spreadsheet',
        focus: 'Departmental Rules + General Knowledge + Mathematics + Reasoning & Analytical Ability + DEST Skill Test',
        tags: [
          'PA & SA Complete Syllabus', 'Departmental Rules', 'Post Office Guide Part I & II',
          'IT Modernization Terminology', 'Postal Products & Services', 'Mails', 'Banking & Remittances',
          'Insurance', 'Stamps & Business', 'Postal Manual Volume VI Part I',
          'Postal Manual Volume VI Part III Chapters 1 & 2', 'Updated SB Orders', 'Postal Manual Volume VII',
          'Foreign Post Manual', 'Indian Geography', 'Civics', 'General Knowledge',
          'Indian Culture & Freedom Struggle', 'Ethics & Moral Study', 'BODMAS', 'Percentage',
          'Profit & Loss', 'Simple Interest', 'Average', 'Time & Work', 'Time & Distance', 'Unitary Method',
          'Reasoning & Analytical Ability', 'Non-Verbal / Pictorial Reasoning',
          'Data Entry Skill Test (DEST) – 1200 Key Depressions (+5%)'
        ],
        sections: [
          {
            title: 'PAPER – I: PART – A: Departmental Rules',
            badge: '50 MCQs | 50 Marks',
            topics: [
              {
                title: 'Departmental Rules & Postal Guides',
                items: [
                  '1. Post Office Guide – Part I',
                  '2. Post Office Guide – Part II',
                  '3. Basic Terminologies related to IT Modernization Project of Department of Posts',
                  '4. Products & Services – Mails, Banking & Remittances, Insurance, Stamps & Business (Reference: India Post Website)',
                  '5. Postal Manual Volume VI – Part I',
                  '6. Postal Manual Volume VI – Part III – Chapter 1 & 2',
                  '7. Updated SB Orders issued by Directorate up to 31st December of the preceding year',
                  '8. Postal Manual Volume VII',
                  '9. Foreign Post Manual'
                ]
              }
            ]
          },
          {
            title: 'PAPER – I: PART – B: General Knowledge, Mathematics & Reasoning',
            badge: '50 Questions | 50 Marks',
            topics: [
              {
                title: 'General Knowledge (10 Questions | 2 Qs per topic)',
                items: [
                  '1. Indian Geography',
                  '2. Civics',
                  '3. General Knowledge',
                  '4. Indian Culture & Freedom Struggle',
                  '5. Ethics & Moral Study'
                ]
              },
              {
                title: 'Mathematics (20 Questions | 2-3 Qs per topic)',
                items: [
                  '1. BODMAS',
                  '2. Percentage',
                  '3. Profit & Loss',
                  '4. Simple Interest',
                  '5. Average',
                  '6. Time & Work',
                  '7. Time & Distance',
                  '8. Unitary Method'
                ]
              },
              {
                title: 'Reasoning & Analytical Ability (20 Questions)',
                items: [
                  'Non-Verbal / Pictorial Reasoning',
                  'Reasoning and Analytical Ability',
                  'Non-Verbal Reasoning',
                  'Pictorial Reasoning'
                ]
              }
            ]
          },
          {
            title: 'PAPER – II: Data Entry Skill Test (DEST)',
            badge: '25 Marks | Skill Test',
            subtitle: 'Data Entry of 1200 Key Depressions (+5%)',
            topics: [
              {
                title: 'Test Requirements & Minimum Qualifying Percentages',
                items: [
                  'Data Entry Skill Test (DEST) – 1200 Key Depressions (+5%)',
                  'General Category: 75% Qualifying',
                  'OBC / EWS Category: 70% Qualifying',
                  'SC / ST Category: 65% Qualifying',
                  'PWD Category: 65% Qualifying (unless exempted)'
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};
