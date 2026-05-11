import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const copilotUsageFile = formData.get('copilot_usage_file');
    const codeGenerationFile = formData.get('code_generation_file');

    if (!copilotUsageFile || !codeGenerationFile) {
      return NextResponse.json({
        status: 'error',
        message: 'Both copilot_usage_file and code_generation_file are required.',
        total_records: 0,
        inserted_records: 0,
        skipped_existing_records: 0,
        invalid_records: 0,
        duplicate_records: 0,
        imported_dates: [],
      }, { status: 400 });
    }

    // In mock mode, simulate a successful import
    return NextResponse.json({
      status: 'success',
      message: 'NDJSON import completed.',
      total_records: 42,
      inserted_records: 40,
      skipped_existing_records: 2,
      invalid_records: 0,
      duplicate_records: 2,
      imported_dates: [],
    });
  } catch {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to process uploaded files.',
      total_records: 0,
      inserted_records: 0,
      skipped_existing_records: 0,
      invalid_records: 0,
      duplicate_records: 0,
      imported_dates: [],
    }, { status: 500 });
  }
}
