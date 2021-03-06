import { queryField } from '@nexus/schema';

export const me = queryField('me', {
  type: 'User',

  resolve: (_, __, { prisma, userId }) => {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  },
});
