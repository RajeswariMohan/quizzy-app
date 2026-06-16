import { test as setup } from '@playwright/test';
import { writeStorageStates } from '../helpers/api-auth';

setup('generate auth storage states', async () => {
  await writeStorageStates();
});
