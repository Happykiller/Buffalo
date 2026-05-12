import { registerEnumType } from '@nestjs/graphql';
import { DailyNoteColumn } from '../../domain/daily-note-column.enum';

registerEnumType(DailyNoteColumn, {
    name: 'DailyNoteColumn',
});

export { DailyNoteColumn };
