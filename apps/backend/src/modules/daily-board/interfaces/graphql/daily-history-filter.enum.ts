import { registerEnumType } from '@nestjs/graphql';
import { DailyHistoryFilter } from '../../domain/daily-history-filter.enum';

registerEnumType(DailyHistoryFilter, {
    name: 'DailyHistoryFilter',
});

export { DailyHistoryFilter };
