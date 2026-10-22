import pool from '../components/db';
import AppError from '../utils/AppError';

type CategoryRow = {
  _id: string;
  title: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

type MemberRow = {
  _id: string;
  category_id: string;
  name: string;
  designation: string;
  affiliation: string;
  email: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

export const formatMember = (member: MemberRow) => ({
  _id: member._id,
  categoryId: member.category_id,
  name: member.name,
  designation: member.designation,
  affiliation: member.affiliation,
  email: member.email,
  sortOrder: member.sort_order,
  created_at: member.created_at,
  updated_at: member.updated_at,
});

export const formatCategory = (category: CategoryRow, members: MemberRow[] = []) => ({
  _id: category._id,
  title: category.title,
  sortOrder: category.sort_order,
  members: members.map(formatMember),
  created_at: category.created_at,
  updated_at: category.updated_at,
});

export const fetchEditorialBoard = async (options?: {
  categoryId?: string;
  includeMembers?: boolean;
}) => {
  const includeMembers = options?.includeMembers !== false;

  let categoryQuery = 'SELECT * FROM editorial_board_categories';
  const categoryParams: string[] = [];

  if (options?.categoryId) {
    categoryQuery += ' WHERE _id = $1';
    categoryParams.push(options.categoryId);
  }

  categoryQuery += ' ORDER BY sort_order ASC, created_at ASC';

  const categoriesResult = await pool.query(categoryQuery, categoryParams);
  const categories = categoriesResult.rows as CategoryRow[];

  if (categories.length === 0) {
    return [];
  }

  if (!includeMembers) {
    return categories.map((category) => formatCategory(category));
  }

  const categoryIds = categories.map((category) => category._id);
  const membersResult = await pool.query(
    `SELECT * FROM editorial_board_members
     WHERE category_id = ANY($1)
     ORDER BY sort_order ASC, created_at ASC`,
    [categoryIds]
  );
  const members = membersResult.rows as MemberRow[];

  return categories.map((category) =>
    formatCategory(
      category,
      members.filter((member) => member.category_id === category._id)
    )
  );
};

export const ensureCategoryExists = async (categoryId: string) => {
  const result = await pool.query(
    'SELECT * FROM editorial_board_categories WHERE _id = $1',
    [categoryId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Editorial board category not found', 404);
  }

  return result.rows[0] as CategoryRow;
};

export const ensureMemberExists = async (memberId: string) => {
  const result = await pool.query(
    'SELECT * FROM editorial_board_members WHERE _id = $1',
    [memberId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Editorial board member not found', 404);
  }

  return result.rows[0] as MemberRow;
};
