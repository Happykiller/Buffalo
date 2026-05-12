import { registerEnumType } from '@nestjs/graphql';
import { DailyHistoryGroupBy } from '../../domain/daily-history-group-by.enum';

registerEnumType(DailyHistoryGroupBy, {
    name: 'DailyHistoryGroupBy',
});

export { DailyHistoryGroupBy };
