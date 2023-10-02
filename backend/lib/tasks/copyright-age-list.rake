namespace :copyright_age_list do
  desc "Generates a CSV-file with jobs and author ages for copyrighted works"
  $rails_rake_task = true
  task generate_file: :environment do |t, args|
    require 'nokogiri'
    # Load all jobs
    jobs = Job.where(copyright: true)

    # For each job, parse the XML and build an array consisting of:
    #   - Job ID
    #   - Title
    #   - Job name (from job.name)
    #   - Authors (array of hashes, each hash containing name, startdate, enddate)
    job_list = []
    jobs.each do |job|
      job_list << parse_job(job)
    end

    # Create a CSV-file with the following columns:
    #   - Job ID (Repeated if multiple authors)
    #   - Title (Repeated if multiple authors)
    #   - Job name (Repeated if multiple authors)
    #   - Author name
    #   - Author startdate
    #   - Author enddate

    filename = ENV['COPYRIGHT_AGE_LIST_FILEPATH']
    # If filename ends with .csv, remove it
    filename = filename[0..-5] if filename[-4..-1] == '.csv'
    # Append date to filename
    filename += '_' + Time.now.strftime('%Y-%m-%d')
    # Append .csv to filename
    filename += '.csv'

    CSV.open(filename, "wb") do |csv|
      csv << ['Job ID', 'Title', 'Job name', 'Author', 'Birth year', 'Death year']
      job_list.sort_by {|j| j['job_id'] }.each do |job|
        job['authors'].each do |author|
          csv << [job['job_id'], job['title'], job['job_name'], author['name'], author['birthyear'], author['deathyear']]
        end
      end
    end
  end
end

def parse_job(job)
  doc = Nokogiri::XML(job.xml)
  doc.remove_namespaces!
  title = extract_title(doc)
  authors = extract_authors(doc)
  {
    'job_id' => job.id,
    'title' => title,
    'job_name' => job.name,
    'authors' => authors
  }
end

def extract_title(doc)
  # Title is the combination of 245 a, b, c, n, p
  title_parts = []
  title_parts << doc.xpath('//datafield[@tag="245"]/subfield[@code="a"]')
  title_parts << doc.xpath('//datafield[@tag="245"]/subfield[@code="b"]')
  title_parts << doc.xpath('//datafield[@tag="245"]/subfield[@code="c"]')
  title_parts << doc.xpath('//datafield[@tag="245"]/subfield[@code="n"]')
  title_parts << doc.xpath('//datafield[@tag="245"]/subfield[@code="p"]')
  # Remove empty parts
  title_parts.reject! { |part| part.empty? }
  # Join the parts together
  title_parts.join(' ')
end

def extract_authors(doc)
  # For authors, we want 100 and 700. "a" for name, "d" for dates.
  # Output is an array of hashes, each hash containing name and birthyear and deathyear
  authors = []
  authors += extract_authors_from_field(doc, '100')
  authors += extract_authors_from_field(doc, '700')
  authors
end

def extract_authors_from_field(doc, field)
  authors = []
  xpath = "//datafield[@tag=\"#{field}\"]"
  doc.xpath(xpath).each do |author_field|
    author = {}
    author['name'] = author_field.xpath('subfield[@code="a"]').text
    # Dates are either a single year, or an open range (e.g. 1920-), or a closed range (e.g. 1920-1925)
    # We want to convert these to a birthyear and deathyear
    dates = author_field.xpath('subfield[@code="d"]').text
    if dates =~ /\d{4}-\d{4}/
      # Closed range
      author['birthyear'] = dates.split('-')[0]
      author['deathyear'] = dates.split('-')[1]
    elsif dates =~ /\d{4}-/
      # Open range
      author['birthyear'] = dates.split('-')[0]
      author['deathyear'] = nil
    else
      # Single year
      author['birthyear'] = dates
      author['deathyear'] = nil
    end
    authors << author
  end
  authors
end
