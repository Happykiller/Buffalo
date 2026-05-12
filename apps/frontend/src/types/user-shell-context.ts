import type { Dispatch, SetStateAction } from 'react';
import type { Theme } from '../themes';
import type { User } from './user';

export interface UserShellContext {
    user: User;
    theme: Theme;
    setTheme: Dispatch<SetStateAction<Theme>>;
}
