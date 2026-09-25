export type Invoice = {
  id: string;
  tenantId: string;
  issuerVat: string;
  receiverVat: string;
  issueDate: string;
  invoiceType: string;
  series: string;
  sequentialNumber: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  myDataMark?: string;
  myDataUid?: string;
};

export type MyDataRecord = {
  tenantId: string;
  mark: string;
  uid: string;
  issuerVat: string;
  receiverVat: string;
  issueDate: string;
  invoiceType: string;
  series: string;
  sequentialNumber: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  cancellationMark?: string;
};

export type VerificationStatus =
  | "verified"
  | "cancelled"
  | "mismatch"
  | "not_found"
  | "ambiguous";

export type FieldDifference = {
  field: "netAmount" | "vatAmount" | "grossAmount";
  lumeoValue: number;
  myDataValue: number;
};

export type VerificationResult = {
  invoiceId: string;
  status: VerificationStatus;
  explanation: string;
  mark?: string;
  uid?: string;
  differences?: FieldDifference[];
};
