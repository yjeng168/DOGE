const axios = require("axios");
const crypto = require("crypto");
const ALL_CFR_TITLES = require("./all50Titles");

class EcfrService {
  constructor() {
    // Try multiple base URLs as the API endpoints have changed
    this.baseURLs = [
      "https://www.ecfr.gov/api/versioner/v1",
      "https://ecfr.federalregister.gov/api/versioner/v1",
      "https://api.federalregister.gov/v1",
    ];
    this.currentBaseURL = null;
    this.client = null;
  }

  async initializeClient() {
    if (this.client) return true;

    // Test each base URL to find working one
    for (const baseURL of this.baseURLs) {
      try {
        console.log(`🔍 Testing API endpoint: ${baseURL}`);
        const testClient = axios.create({
          baseURL,
          timeout: 10000,
          headers: {
            "User-Agent": "Federal-Regulations-Analyzer/1.0",
          },
        });

        // Test with a simple endpoint
        await testClient.get("/");
        console.log(`✅ Found working endpoint: ${baseURL}`);
        this.currentBaseURL = baseURL;
        this.client = testClient;
        return true;
      } catch (error) {
        console.log(`❌ Failed: ${baseURL} - ${error.message}`);
        continue;
      }
    }

    throw new Error("No working eCFR API endpoints found");
  }

  // Alternative approach: Use Federal Register API for CFR data
  async getFederalRegisterCFR() {
    try {
      const frClient = axios.create({
        baseURL: "https://api.federalregister.gov/v1",
        timeout: 30000,
        headers: {
          "User-Agent": "Federal-Regulations-Analyzer/1.0",
        },
      });

      console.log("📡 Fetching from Federal Register API...");

      // Get recent CFR-related documents
      const response = await frClient.get("/documents.json", {
        params: {
          "conditions[cfr][title]": "21", // Start with FDA (Title 21)
          per_page: 20,
          order: "relevance",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Federal Register API error:", error.message);
      throw error;
    }
  }

  // Generate comprehensive sample data using all 50 CFR titles
  async getSampleCFRData() {
    console.log("📚 Generating comprehensive CFR data (all 50 titles)...");

    const titles = ALL_CFR_TITLES.map((titleInfo) => ({
      number: titleInfo.number,
      name: titleInfo.name,
      agency: titleInfo.agency,
      shortName: titleInfo.shortName,
      parts: this.generatePartsForTitle(titleInfo),
    }));

    console.log(`✅ Generated data for ${titles.length} CFR titles`);
    return { titles };
  }

  generatePartsForTitle(titleInfo) {
    // Generate 2-4 parts per title for demonstration
    const partCount = Math.floor(Math.random() * 3) + 2;
    const parts = [];

    for (let i = 1; i <= partCount; i++) {
      const partNumber = i * 10; // Part numbers like 10, 20, 30, etc.
      parts.push({
        number: partNumber,
        name: this.getPartName(titleInfo, partNumber),
        sections: this.generateSectionsForPart(titleInfo, partNumber),
      });
    }

    return parts;
  }

  getPartName(titleInfo, partNumber) {
    const partNames = {
      1: "General Provisions",
      10: "General Provisions and Definitions",
      20: "Implementation Standards",
      30: "Administrative Procedures",
      40: "Compliance and Enforcement",
    };

    return partNames[partNumber] || `${titleInfo.name} - Part ${partNumber}`;
  }

  generateSectionsForPart(titleInfo, partNumber) {
    // Generate 2-5 sections per part
    const sectionCount = Math.floor(Math.random() * 4) + 2;
    const sections = [];

    for (let i = 1; i <= sectionCount; i++) {
      const sectionNumber = `${partNumber}.${i}`;
      sections.push({
        number: sectionNumber,
        content: this.generateContentForTitle(titleInfo, partNumber, i),
        lastUpdated: this.getRandomUpdateDate(),
      });
    }

    return sections;
  }

  generateContentForTitle(titleInfo, partNumber, sectionNumber) {
    const baseContent = this.getContentTemplate(titleInfo);
    const specificContent = this.getSpecificContent(
      titleInfo,
      partNumber,
      sectionNumber
    );

    return `${baseContent} ${specificContent}`;
  }

  getContentTemplate(titleInfo) {
    const templates = {
      "General Provisions":
        "This title establishes general administrative provisions and procedures applicable across federal agencies. Agencies must comply with standardized reporting requirements, maintain accurate records, and follow prescribed notification procedures.",
      "Grants and Agreements":
        "Federal grant and agreement procedures require recipients to maintain detailed financial records, comply with audit requirements, and submit periodic performance reports. All expenditures must be documented and justified.",
      "The President":
        "Executive orders and presidential directives establish policy frameworks for federal agencies. Implementation requires coordination among departments and regular progress reporting to the Executive Office.",
      Accounts:
        "Federal accounting standards require accurate financial reporting, internal controls, and compliance with Generally Accepted Accounting Principles. Agencies must maintain detailed transaction records and submit quarterly reports.",
      "Administrative Personnel":
        "Federal personnel management includes recruitment, classification, compensation, and performance evaluation procedures. Agencies must ensure equal employment opportunity and maintain comprehensive personnel records.",
      "Domestic Security":
        "Homeland security regulations establish threat assessment procedures, emergency response protocols, and information sharing requirements among federal, state, and local agencies.",
      Agriculture:
        "Agricultural regulations cover food safety, crop insurance, conservation programs, and rural development initiatives. Compliance requires detailed documentation and regular inspections.",
      "Aliens and Nationality":
        "Immigration regulations establish admission procedures, documentation requirements, and enforcement mechanisms. Processing requires comprehensive background checks and documentation review.",
      "Animals and Animal Products":
        "Veterinary and animal product regulations ensure public health through inspection requirements, disease control measures, and facility sanitation standards.",
      Energy:
        "Energy regulations cover nuclear safety, renewable energy standards, and utility oversight. Compliance requires technical documentation and regular safety assessments.",
      "Federal Elections":
        "Campaign finance regulations establish contribution limits, disclosure requirements, and enforcement procedures. Candidates must maintain detailed financial records and submit periodic reports.",
      "Banks and Banking":
        "Banking regulations ensure financial stability through capital requirements, risk management standards, and consumer protection measures. Regular examinations verify compliance.",
      "Business Credit and Assistance":
        "Small business programs provide loans, grants, and technical assistance. Recipients must meet eligibility criteria and comply with reporting requirements.",
      "Aeronautics and Space":
        "Aviation safety regulations establish aircraft certification, pilot licensing, and operational standards. Compliance requires regular inspections and maintenance documentation.",
      "Commerce and Foreign Trade":
        "International trade regulations cover export controls, import procedures, and trade agreement implementation. Documentation must verify compliance with applicable restrictions.",
      "Commercial Practices":
        "Consumer protection regulations prohibit unfair or deceptive practices and establish disclosure requirements. Companies must maintain compliance programs and customer complaint procedures.",
      "Commodity and Securities Exchanges":
        "Securities regulations require public companies to file periodic reports, maintain internal controls, and provide accurate investor disclosures.",
      "Conservation of Power and Water Resources":
        "Utility regulations establish rate structures, service standards, and environmental compliance requirements. Regular filings demonstrate cost recovery and system reliability.",
      "Customs Duties":
        "Import regulations establish classification procedures, duty assessment, and entry documentation requirements. Importers must maintain detailed transaction records.",
      "Employees' Benefits":
        "Employee benefit regulations cover pension plans, health insurance, and workers compensation. Plan administrators must file annual reports and maintain participant records.",
      "Food and Drugs":
        "FDA regulations ensure product safety through premarket approval, manufacturing standards, and post-market surveillance. Companies must maintain comprehensive quality systems.",
      "Foreign Relations":
        "Diplomatic regulations establish embassy operations, visa procedures, and international agreement implementation. Documentation must comply with treaty obligations.",
      Highways:
        "Highway safety regulations establish design standards, construction specifications, and maintenance requirements. State agencies must demonstrate compliance for federal funding.",
      "Housing and Urban Development":
        "Housing regulations provide affordable housing programs, fair housing enforcement, and community development funding. Recipients must meet eligibility and performance standards.",
      Indians:
        "Tribal regulations establish government-to-government relationships, land management procedures, and program administration. Implementation requires consultation with tribal authorities.",
      "Internal Revenue":
        "Tax regulations establish filing requirements, payment procedures, and enforcement mechanisms. Taxpayers must maintain supporting documentation for all reported items.",
      "Alcohol, Tobacco Products and Firearms":
        "ATF regulations control manufacturing, distribution, and sales of regulated products. Licensees must maintain detailed records and submit regular reports.",
      "Judicial Administration":
        "Court administration regulations establish case management procedures, filing requirements, and administrative standards. Courts must maintain accurate records and statistical reports.",
      Labor:
        "Labor regulations establish workplace safety standards, wage and hour requirements, and collective bargaining procedures. Employers must maintain compliance programs and employee records.",
      "Mineral Resources":
        "Mining regulations establish extraction permits, safety standards, and environmental protection requirements. Operators must demonstrate compliance through regular inspections.",
      "Money and Finance: Treasury":
        "Treasury regulations establish fiscal policy implementation, debt management, and financial institution oversight. Regular reporting ensures system stability.",
      "National Defense":
        "Defense regulations establish procurement procedures, security requirements, and operational standards. Contractors must maintain facility clearances and personnel security.",
      "Navigation and Navigable Waters":
        "Maritime regulations establish vessel safety standards, navigation procedures, and environmental protection requirements. Operators must maintain certification and inspection records.",
      Education:
        "Education regulations establish funding formulas, academic standards, and accountability measures. Recipients must demonstrate student progress and fiscal responsibility.",
      "Panama Canal":
        "Canal operations require coordination with international shipping, maintenance of navigation standards, and environmental protection. Regular inspections ensure operational safety.",
      "Parks, Forests, and Public Property":
        "Public land management includes conservation programs, recreational access, and resource protection. Activities require permits and environmental assessments.",
      "Patents, Trademarks, and Copyrights":
        "Intellectual property regulations establish application procedures, examination standards, and enforcement mechanisms. Applicants must provide detailed technical documentation.",
      "Pensions, Bonuses, and Veterans' Relief":
        "Veterans benefits include disability compensation, education assistance, and healthcare services. Eligibility requires military service verification and medical documentation.",
      "Postal Service":
        "Postal regulations establish delivery standards, rate structures, and service requirements. Operations must meet universal service obligations and maintain delivery performance.",
      "Protection of Environment":
        "Environmental regulations establish pollution control standards, permit requirements, and enforcement procedures. Facilities must demonstrate compliance through monitoring and reporting.",
      "Public Contracts and Property Management":
        "Federal procurement regulations establish competition requirements, contract administration, and performance standards. Contractors must maintain detailed cost and performance records.",
      "Public Health":
        "Public health regulations establish disease surveillance, emergency preparedness, and healthcare quality standards. Providers must maintain patient records and report communicable diseases.",
      "Public Lands":
        "Land management regulations establish multiple use principles, conservation requirements, and recreational access. Activities require environmental impact assessments.",
      "Emergency Management and Assistance":
        "Emergency management includes disaster preparedness, response coordination, and recovery assistance. Plans must address all hazards and include resource allocation.",
      "Public Welfare":
        "Welfare programs provide assistance to eligible individuals and families. Recipients must meet income and resource limitations and comply with work requirements.",
      Shipping:
        "Maritime transportation regulations establish vessel safety, crew certification, and cargo handling standards. Operators must maintain inspection certificates and training records.",
      Telecommunication:
        "Communications regulations establish service standards, spectrum management, and consumer protection requirements. Providers must maintain service quality and accessibility.",
      "Federal Acquisition Regulations System":
        "Procurement regulations establish competition requirements, contract terms, and administration procedures. Agencies must demonstrate best value and maintain procurement integrity.",
      Transportation:
        "Transportation safety regulations establish vehicle standards, operator certification, and infrastructure requirements. Regular inspections ensure public safety.",
      "Wildlife and Fisheries":
        "Wildlife regulations establish conservation programs, hunting and fishing licenses, and habitat protection requirements. Activities require permits and species impact assessments.",
    };

    return (
      templates[titleInfo.name] ||
      `Federal regulations for ${titleInfo.name} establish standards, procedures, and requirements for regulated entities. Compliance requires documentation, reporting, and regular inspections.`
    );
  }

  getSpecificContent(titleInfo, partNumber, sectionNumber) {
    const specificRequirements = [
      "Detailed record-keeping requirements include maintaining all supporting documentation for a minimum of seven years.",
      "Regular reporting obligations require submission of quarterly compliance reports and annual certification statements.",
      "Inspection procedures include announced and unannounced visits by authorized federal representatives.",
      "Training requirements mandate annual certification for all personnel involved in regulated activities.",
      "Quality assurance programs must include internal audits, corrective action procedures, and management review.",
      "Public notification procedures require timely disclosure of material changes affecting regulated activities.",
      "Financial assurance requirements include bonding, insurance, or other acceptable forms of security.",
      "Environmental monitoring includes regular sampling, analysis, and reporting of specified parameters.",
      "Emergency response procedures must address potential incidents and include notification requirements.",
      "Appeal procedures allow for administrative review of adverse decisions with specified timeframes.",
    ];

    // Select 2-3 specific requirements randomly
    const selectedRequirements = [];
    const count = Math.floor(Math.random() * 2) + 2;

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(
        Math.random() * specificRequirements.length
      );
      if (!selectedRequirements.includes(specificRequirements[randomIndex])) {
        selectedRequirements.push(specificRequirements[randomIndex]);
      }
    }

    return selectedRequirements.join(" ");
  }

  getRandomUpdateDate() {
    const start = new Date("2023-01-01");
    const end = new Date("2024-12-31");
    const randomTime =
      start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime);
  }

  // Helper functions
  extractTextContent(htmlContent) {
    if (!htmlContent) return "";
    return htmlContent
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  }

  countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  generateChecksum(content) {
    return crypto
      .createHash("md5")
      .update(content || "")
      .digest("hex");
  }

  calculateComplexityScore(text) {
    if (!text) return 0;

    const wordCount = this.countWords(text);
    const sentences = text.split(/[.!?]+/).length - 1;
    const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : 0;

    const technicalTerms = (
      text.match(
        /\b(shall|must|required|pursuant|thereof|compliance|standards)\b/gi
      ) || []
    ).length;
    const numbers = (text.match(/\d+/g) || []).length;
    const references = (text.match(/\b\d+\s*CFR\s*\d+/gi) || []).length;

    const complexityScore = Math.min(
      100,
      avgWordsPerSentence * 0.3 +
        (technicalTerms / wordCount) * 100 * 0.4 +
        (numbers / wordCount) * 100 * 0.2 +
        references * 5 * 0.1
    );

    return Math.round(complexityScore * 10) / 10;
  }

  async delay(ms = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new EcfrService();
