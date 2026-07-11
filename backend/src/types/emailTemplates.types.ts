import { Document, Types } from 'mongoose';

// Add the template variable interface
export interface ITemplateVariable {
    variable: string;
    validationRegex?: string | null;
}

export interface IEmailTemplate {
    _id: Types.ObjectId;
    templateType: string;
    name: string;
    description?: string | null;
    providerName: string;
    isActive: boolean;
    from?: string | null;
    replyTo?: string | null;
    htmlContent: string;
    variables: ITemplateVariable[];
    defaultData?: Record<string, string | number | boolean>;
    lastUpdated: Date;
}

export interface IEmailTemplateDocument extends Document, Omit<IEmailTemplate, '_id'> {
    _id: Types.ObjectId;
}