import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Application,
  ApplicationStatus,
  OnboardingDocument,
  OnboardingDocumentType,
  Prisma,
  ProgressionDashboardState,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/dto/auth-user.type';
import { SubmitOnboardingDocumentDto } from './dto/submit-document.dto';
import { AcknowledgeOnboardingDto } from './dto/acknowledge.dto';

type RequiredSlot = {
  document_type: OnboardingDocumentType;
  title: string;
  description?: string;
  requires_physical_signature?: boolean;
};

const REQUIRED_SLOTS: RequiredSlot[] = [
  {
    document_type: 'cys_form',
    title: 'CYS form',
    description: 'Company Year Schedule form issued by your school.',
    requires_physical_signature: false,
  },
  {
    document_type: 'logbook',
    title: 'SIWES logbook',
    description: 'Upload signed and stamped pages.',
    requires_physical_signature: true,
  },
  {
    document_type: 'acceptance_letter',
    title: 'Acceptance letter',
    description: 'Letter from Talent Nation acknowledging your placement.',
    requires_physical_signature: false,
  },
  {
    document_type: 'other',
    title: 'Student ID card',
    description: 'A clear photo of the front of your active student ID.',
    requires_physical_signature: false,
  },
];

const STATUSES_ALLOWING_ONBOARDING: ApplicationStatus[] = [
  ApplicationStatus.review,
  ApplicationStatus.verification_pending,
  ApplicationStatus.verified,
  ApplicationStatus.onboarding,
  ApplicationStatus.accepted,
];

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async listDocuments(user: AuthUser) {
    const application = await this.requireApplication(user.sub);
    const docs = await this.prisma.onboardingDocument.findMany({
      where: { applicationId: application.id },
      orderBy: { uploadedAt: 'desc' },
    });

    const latestByType = new Map<OnboardingDocumentType, OnboardingDocument>();
    for (const doc of docs) {
      if (!latestByType.has(doc.documentType)) {
        latestByType.set(doc.documentType, doc);
      }
    }

    const required_documents = REQUIRED_SLOTS.map((slot) => {
      const uploaded = latestByType.get(slot.document_type);
      return {
        document_type: slot.document_type,
        title: slot.title,
        description: slot.description,
        requires_physical_signature: slot.requires_physical_signature ?? false,
        uploaded: uploaded
          ? {
              id: uploaded.id,
              status: uploaded.status,
              file_url: uploaded.fileUrl,
              uploaded_at: uploaded.uploadedAt,
            }
          : null,
      };
    });

    return {
      required_documents,
      campus_signing_contact: null,
    };
  }

  async submitDocument(user: AuthUser, dto: SubmitOnboardingDocumentDto) {
    const application = await this.requireApplication(user.sub);

    const created = await this.prisma.onboardingDocument.create({
      data: {
        applicationId: application.id,
        documentType: dto.document_type,
        fileUrl: dto.file_url,
        originalFilename: dto.original_filename,
        metadata: (dto.metadata ?? null) as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      id: created.id,
      application_id: created.applicationId,
      document_type: created.documentType,
      file_url: created.fileUrl,
      original_filename: created.originalFilename,
      status: created.status,
      metadata: created.metadata,
      uploaded_at: created.uploadedAt,
    };
  }

  async acknowledge(user: AuthUser, dto: AcknowledgeOnboardingDto) {
    if (!dto.ack) {
      throw new BadRequestException({
        error: { code: 'ack_required', message: 'Acknowledgement must be true' },
      });
    }

    const application = await this.requireApplication(user.sub);
    if (!STATUSES_ALLOWING_ONBOARDING.includes(application.status)) {
      throw new ForbiddenException({
        error: {
          code: 'onboarding_not_open',
          message: 'Onboarding is not yet available for this application',
        },
      });
    }

    const docs = await this.prisma.onboardingDocument.findMany({
      where: { applicationId: application.id },
    });
    const uploadedTypes = new Set(docs.map((doc) => doc.documentType));
    const missing = REQUIRED_SLOTS.map((slot) => slot.document_type).filter(
      (type) => !uploadedTypes.has(type),
    );
    if (missing.length > 0) {
      throw new BadRequestException({
        error: {
          code: 'missing_documents',
          message: 'Upload all required documents before acknowledging',
          details: { missing },
        },
      });
    }

    const allApproved = docs.every((doc) => doc.status === 'approved');
    const nextStatus = allApproved ? ApplicationStatus.accepted : ApplicationStatus.onboarding;
    const nextDashboard = allApproved
      ? ProgressionDashboardState.full_learning
      : ProgressionDashboardState.onboarding_form;

    const metadata = (application.metadata ?? {}) as Record<string, unknown>;
    metadata.onboarding_acknowledged = true;
    metadata.onboarding_acknowledged_at = new Date().toISOString();

    const updated = await this.prisma.application.update({
      where: { id: application.id },
      data: {
        status: nextStatus,
        dashboardState: nextDashboard,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      application: {
        status: updated.status,
        dashboard_state: updated.dashboardState,
      },
    };
  }

  private async requireApplication(userId: string): Promise<Application> {
    const application = await this.prisma.application.findFirst({
      where: { userId },
      orderBy: { registeredAt: 'desc' },
    });
    if (!application) {
      throw new NotFoundException({
        error: { code: 'no_application', message: 'No application found for current user' },
      });
    }
    return application;
  }
}
