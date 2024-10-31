import { inject, injectable } from 'inversify';
import { sort } from 'moderndash';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { LetterDto, LettersRequestDto, PdfRequestDto } from '~/.server/domain/dtos';
import type { LetterDtoMapper } from '~/.server/domain/mappers';
import type { LetterRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

export interface LetterService {
  /**
   * Find all letters for a given client id.
   *
   * @param lettersRequestDto The letters request dto that includes the client id and user id for auditing
   * @returns A Promise that resolves to all letters found for the client id.
   */
  findLettersByClientId(lettersRequestDto: LettersRequestDto): Promise<ReadonlyArray<LetterDto>>;

  /**
   * Retrieve the PDF for a given letter id.
   *
   * @param pdfRequestDto  The PDF request dto that includes the letter id and user id for auditing
   * @returns A Promise that resolves to the PDF data as a base64-encoded string representing the bytes.
   */
  getPdfByLetterId(pdfRequestDto: PdfRequestDto): Promise<string>;
}

@injectable()
export class LetterServiceImpl implements LetterService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.LETTER_DTO_MAPPER) private readonly letterDtoMapper: LetterDtoMapper,
    @inject(SERVICE_IDENTIFIER.LETTER_REPOSITORY) private readonly letterRepository: LetterRepository,
    @inject(SERVICE_IDENTIFIER.AUDIT_SERVICE) private readonly auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('LetterServiceImpl');
  }

  async findLettersByClientId({ clientId, userId, sortOrder = 'desc' }: LettersRequestDto): Promise<ReadonlyArray<LetterDto>> {
    this.log.trace('Finding letters with clientId [%s], userId [%s], and sortOrder [%s]', clientId, userId, sortOrder);

    this.auditService.createAudit('letters.get', { userId });

    const letterEntities = await this.letterRepository.findLettersByClientId(clientId);
    const letterDtos = this.letterDtoMapper.mapLetterEntitiesToLetterDtos(letterEntities);
    const sortedLetterDtos = sort(letterDtos, {
      order: sortOrder,
      by: (letterDto) => letterDto.date,
    });

    this.log.trace('Returning letters [%j] for clientId [%s]', sortedLetterDtos, clientId);
    return sortedLetterDtos;
  }

  async getPdfByLetterId({ letterId, userId }: PdfRequestDto): Promise<string> {
    this.log.trace('Finding PDF with letterId [%s] and userId [%s]', letterId, userId);

    this.auditService.createAudit('pdf.get', { letterId, userId });

    const pdfEntity = await this.letterRepository.getPdfByLetterId(letterId);
    const pdf = this.letterDtoMapper.mapPdfEntityToString(pdfEntity);

    this.log.trace('Returning pdf [%s] for letterId [%s]', pdf, letterId);
    return pdf;
  }
}