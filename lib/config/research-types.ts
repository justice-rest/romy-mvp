import {
  GitCompareIcon,
  HelpCircleIcon,
  News01Icon,
  Note01Icon,
  Search01Icon,
  Home01Icon,
  Store01Icon,
  HeartCheckIcon,
  MoneySend01Icon
} from '@hugeicons/core-free-icons'

export type ResearchType =
  | 'research'
  | 'compare'
  | 'latest'
  | 'summarize'
  | 'explain'

export type DataType =
  | 'home-valuations'
  | 'business-ownership'
  | 'charitable-history'
  | 'political-donations'

export interface ResearchTypeConfig {
  value: ResearchType
  label: string
  description: string
  icon: any // HugeIcon type
}

export interface DataTypeConfig {
  value: DataType
  label: string
  description: string
  icon: any // HugeIcon type
  promptEnhancement: string
}

// Centralized research type configuration
export const RESEARCH_TYPE_CONFIGS: ResearchTypeConfig[] = [
  {
    value: 'research',
    label: 'Research',
    description: 'Deep research with comprehensive analysis',
    icon: Search01Icon
  },
  {
    value: 'compare',
    label: 'Compare',
    description: 'Side-by-side comparison of options',
    icon: GitCompareIcon
  },
  {
    value: 'latest',
    label: 'Latest',
    description: 'Most recent news and updates',
    icon: News01Icon
  },
  {
    value: 'summarize',
    label: 'Summarize',
    description: 'Concise summary of content',
    icon: Note01Icon
  },
  {
    value: 'explain',
    label: 'Explain',
    description: 'Clear explanations made simple',
    icon: HelpCircleIcon
  }
]

// Data types configuration for specialized searches
export const DATA_TYPE_CONFIGS: DataTypeConfig[] = [
  {
    value: 'home-valuations',
    label: 'Home Valuations',
    description: 'Property ownership and valuations',
    icon: Home01Icon,
    promptEnhancement: 'In addition to providing general information about the search subject, prioritize finding and presenting detailed information about their property ownership and home valuations. Include residential and commercial properties they own, estimated valuations, historical purchase prices, appreciation over time, and any available property records. Ensure the response clearly connects the subject to this specific data type with relevant examples, figures, and sources.'
  },
  {
    value: 'business-ownership',
    label: 'Business Ownership',
    description: 'Companies and ownership stakes',
    icon: Store01Icon,
    promptEnhancement: 'In addition to providing general information about the search subject, prioritize finding and presenting detailed information about their business ownership. Include companies they own or have ownership stakes in, percentage of ownership, valuation of those holdings, board positions, and relevant business interests. Ensure the response clearly connects the subject to this specific data type with relevant examples, figures, and sources.'
  },
  {
    value: 'charitable-history',
    label: 'Charitable History',
    description: 'Philanthropy and donations',
    icon: HeartCheckIcon,
    promptEnhancement: 'In addition to providing general information about the search subject, prioritize finding and presenting detailed information about their charitable history. Include charitable donations made, organizations and causes supported, timeline of giving, donation amounts, philanthropic initiatives, and any charitable foundations or programs they\'ve established. Ensure the response clearly connects the subject to this specific data type with relevant examples, figures, and sources.'
  },
  {
    value: 'political-donations',
    label: 'Political Donations',
    description: 'Political contributions and affiliations',
    icon: MoneySend01Icon,
    promptEnhancement: 'In addition to providing general information about the search subject, prioritize finding and presenting detailed information about their political donations. Include political contributions made, recipients (candidates, PACs, parties), amounts and dates of donations, political affiliations, and any patterns in their political giving. Ensure the response clearly connects the subject to this specific data type with relevant examples, figures, and sources.'
  }
]

// Helper function to get a specific research type config
export function getResearchTypeConfig(
  type: ResearchType
): ResearchTypeConfig | undefined {
  return RESEARCH_TYPE_CONFIGS.find(config => config.value === type)
}

// Helper function to get a specific data type config
export function getDataTypeConfig(
  type: DataType
): DataTypeConfig | undefined {
  return DATA_TYPE_CONFIGS.find(config => config.value === type)
}

