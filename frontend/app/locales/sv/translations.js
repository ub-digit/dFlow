export default {
  other_lang: 'en',
  main: {
    title: "DFLOW",
    description: "Flödeshantering för digitalisering - Göteborgs Unviversitetsbibliotek"
  },
  menu: {
    login: "Logga in",
    logout: "Logga ut",
    nodes: "Bläddra",
    logged_in_as: "Inloggad som:",
    statistics: "Statistik",
    users: "Användare",
    jobs: "Jobblista",
    quarantine: "Karantän"
  },
  statistics: {
    create_file: "Skapa statistikunderlag",
    start_date: "Startdatum",
    start_date_placeholder: "åååå-mm-dd",
    start_date_alert: "Startdatumet måste vara ett giltigt datum på formen 'ÅÅÅÅ-MM-DD'",
    end_date: "Slutdatum",
    end_date_placeholder: "åååå-mm-dd",
    end_date_alert: "Slutdatumet måste vara ett giltigt datum på formen 'ÅÅÅÅ-MM-DD'",
    start_creation: "Skapa fil",
    download_file: "Ladda ned fil",
    confirm_create_file: "Välj OK om du vill skapa följande fil:",
    file_name: {
      header: "dFlow-statistikdata",
      until: "till",
      extracted: "uttaget",
      now_format: "YYYY-MM-DD_HH.mm.ss"
    },
    build_status: {
      initializing: "Förbereder",
      querying_database: "Kör databasfråga",
      database_queried: "Resultat erhållet från databasen. Skapar arbetsbok",
      workbook_built: "Arbetsbok skapad",
      xls_data_output: "Xls-data utskrivet till IO",
      ready_for_download: "Klart för nedladdning"
    },
    file_creation_error: "Kunde inte skapa filen."
  },
  login: {
    password: "Lösenord",
    username: "Användarnamn",
    login: "Logga in",
    casLogin: "Logga in med CAS",
    loginError: "Fel användarnamn eller lösenord."
  },
  nodes: {
    id: "ID",
    name: "Namn",
    new: "Skapa ny katalog",
    create: "Spara",
    creating: "Sparar",
    edit: "Redigera",
    update: "Spara ändringar",
    updating: "Sparar ändringar",
    cancel: "Avbryt",
    children: {
      header: "Kataloger"
    },
    root: "Topp",
    new_parent_id: "ID på ny förälder",
    move_confirm_root: "Är du säker på att du vill flytta katalogen till toppnivå?",
    move_root_denied: "Du har inte rätt att flytta kataloger till toppnivå!",
    move_confirm: "Är du säker på att du vill flytta katalogen till",
    move_parent_not_found: "Kunde inte hitta destinationskatalogen",
    delete: "Radera katalogen",
    deleting: "Raderar katalogen",
    generalError: "Det uppstod ett fel när katalogen skulle flyttas eller raderas",
    confirm_delete: "Är du säker på att du vill radera katalogen och ALLA dess underliggande kataloger och jobb från systemet?",
    hasActionStates: "Innehåller jobb som väntar på manuell åtgärd"
  },
  users: {
    id: "ID",
    header: "Användare",
    name: "Namn",
    username: "Användarnamn",
    role: "Roll",
    email: "E-post",
    new: "Skapa ny användare",
    create: "Skapa användare",
    edit: "Redigera",
    update: "Spara ändringar",
    cancel: "Avbryt",
    delete: "Radera användare",
    confirm_delete: "Är du säker på att du vill radera användaren från systemet?",
    password: "Lösenord",
    password_confirmation: "Bekräfta lösenord"
  },
  sources: {
    formlabel: "Källa",
    id: "ID",
    name: "Namn",
    label: "etikett",
    fetch: "Hämta",
    dc: {
      title: "DC Title",
      creator: "DC Creator",
      subject: "DC Subject",
      description: "DC Description",
      publisher: "DC Publisher",
      contributor: "DC Contributor",
      date: "DC Date",
      type: "DC Type",
      format: "DC Format",
      identifier: "DC Identifier",
      source: "DC Source",
      language: "DC Language",
      relation: "DC Relation",
      coverage: "DC Coverage",
      rights: "DC Rights"
    }
  },
  jobs: {
    header: "Jobb",
    import: "Importera jobb",
    file_path: "Filsökväg",
    node_name: "Katalognamn",
    import_success: "Korrekta jobb",
    import_file_error_row: "Fel på radnummer",
    import_running: "Import pågår",
    import_finished: "Import klar",
    import_aborted: "Import avbruten p g a fel",
    new: "Skapa jobb",
    cancel: "Avbryt",
    source: "Källa",
    catalog_id: "ID",
    name: "Namn",
    title: "Titel",
    author: "Författare",
    copyright: "Copyright",
    priority: "Prioritet",
    comment: "Kommentarer",
    object_info: "Objektinformation",
    id: "ID",
    idMissing: "Ogiltigt jobb-ID",
    edit: "Redigera",
    save: "Spara",
    saving: "Sparar",
    breadcrumb: "Placering",
    copyright_values: {
      'unselected': "-- Välj --",
      'true': "Får EJ publiceras",
      'false': "Får publiceras"
    },
    priority_values: {
      "normal": "Normal",
      "high": "Hög",
      "low": "Låg",
      "none": "Ingen"
    },
    search: "Sök",
    searchById: "Jobb-ID",
    print: "Utskrift",
    start: "Starta digitalisering",
    delete: "Radera jobb",
    confirm_delete: "Är du säker på att du vill radera jobbet från systemet?",
    pdfLink: "Öppna PDF",
    type_of_record: {
      label: "Typ",
      am: "Monografi",
      as: "Periodika",
      tm: "Handskrift"
    },
    status: "Status",
    state: "Läge",
    message: "Meddelande",
    statuses: {
      waiting_for_digitizing: "Väntar på digitalisering",
      digitizing: "Digitalisering pågår",
      post_processing: "Efterbearbetning",
      post_processing_user_input: "Manuell efterbearbetning",
      quality_control: "Kvalitetskontroll",
      waiting_for_package_metadata_import: "Väntar på metadataimport",
      package_metadata_import: "Importerar metadata",
      mets_control: "Metskontroll",
      mets_production: "Metsproduktion",
      waiting_for_mets_control: "Väntar på metskontroll",
      done: "Klar!"
    },
    history: "Historik",
    other: "Övrigt",
    xml: "XML",
    files: "Filer",
    loadingFiles: "Fillista hämtas...",
    noFiles: "Inga filer att visa.",
    ordinality: "Ordinalitet",
    chronology: "Kronologi",
    key: "Nyckel",
    value: "Värde",
    ordOneKeyPH: "Ex. Årg.",
    ordTwoKeyPH: "Ex. Nr.",
    ordThreeKeyPH: "",
    ordOneValuePH: "Ex. 13",
    ordTwoValuePH: "Ex. 42",
    ordThreeValuePH: "",
    chronOneKeyPH: "Ex. År",
    chronTwoKeyPH: "Ex. Månad",
    chronThreeKeyPH: "Ex. Dag",
    chronOneValuePH: "Ex. 1934",
    chronTwoValuePH: "Ex. 42",
    chronThreeValuePH: "Ex. 12",
    quarantine: "Sätt i karantän",
    unQuarantine: "Ta ur karantän",
    qualityControl: "Kvalitetskontroll OK",
    restart: "Starta om jobb",
    preview: "Förhandsgranskning",
    flow: "Flöde",
    flowStep: "Flödessteg",
    number_of_images: "Antal sidor",
    metadata: "Metadata",
    publicationLog: "Publiceringslogg",
    states: {
      start: "Ej påbörjade",
      inProgress: "Pågående",
      done: "Klara",
      START: "Ej påbörjad",
      FINISH: "Klar",
      PROCESS: "Under arbete",
      ACTION: "Väntar på manuell hantering",
      WAITFOR: "Väntar på filer"
    }
  },
  activityevent: {
    STATUS: 'Byte av status',
    CREATE: 'Jobb skapat',
    QUARANTINE: 'Satt i karantän',
    UNQUARANTINE: 'Plockats ur karantän',
    RESTART: 'Startats om',
    STARTED: 'Flödessteg aktiverat',
    FINISHED: 'Flödessteg klart!',
    FLOW_STEP: 'Nytt flödessteg',
    SKIPPED: 'Hoppat över steg!'
  },
  activitymessage: {
    UNQUARANTINED: '',
    ACTIVITY_CREATED: ''
  },
  paginator: {
    showing: "Visar",
    of: "av",
    hit: "träff",
    hits: "träffar",
    noHits: "Sökningen gav inga träffar!",
    page: "sida",
    pages: "sidor"
  },
  flowStep: {
    startedSince: "Startad: ",
    waitingSince: "Aktiverad: ",
    step: "ID",
    description: "Namn",
    process: "Processtyp",
    params: "Parametrar",
    goto_true: "Gå till (sant)",
    goto_false: "Gå till (falskt)",
    entered_at: "Aktiverad",
    started_at: "Startad",
    finished_at: "Avslutad",
    manual_finish: "Avsluta manuellt",
    set_new_flow_step: "Byt flödessteg"
  }
};

