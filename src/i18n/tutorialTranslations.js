import { normalizeStudyLanguage } from "./studyCopy.js";

const idTutorials = {
  tutorial_001: {
    title: "Es Krim Cokelat Mudah Tanpa Telur dan Tanpa Mesin Es Krim",
    description:
      "Es krim cokelat rumahan dengan daftar bahan singkat dan metode kantong es, tanpa mesin es krim.",
    category: "Memasak",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "krim kental",
      "susu full cream",
      "gula putih",
      "chocolate chip semi-manis",
      "bubuk kakao tanpa gula",
      "ekstrak vanila",
      "garam batu",
      "kantong zip",
      "pengocok",
      "mangkuk",
      "handuk",
    ],
    steps: [
      "Kocok susu dan krim di dalam mangkuk.",
      "Hangatkan campuran, lalu tambahkan gula, chocolate chip, dan bubuk kakao sampai cokelat melunak dan bahan kering larut.",
      "Masukkan vanila dan biarkan adonan es krim dingin sebelum didinginkan sebentar.",
      "Tutup adonan dalam kantong zip kecil, masukkan ke kantong lebih besar berisi es dan garam batu, lalu kocok sampai mengental.",
      "Bekukan lebih lama jika ingin tekstur lebih padat, lalu ambil dengan sendok es krim dan sajikan.",
    ],
  },
  tutorial_002: {
    title: "Quesadilla Sarapan 5 Menit",
    description:
      "Wrap sarapan sangat cepat dari tortilla atau pita, telur orak-arik, keju, dan sisa sayuran.",
    category: "Memasak",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "tortilla atau wrap",
      "telur",
      "lembaran keju",
      "garam",
      "sisa sayuran",
      "wajan",
      "mangkuk kecil",
      "spatula kayu",
    ],
    steps: [
      "Hangatkan tortilla atau wrap perlahan di wajan tertutup.",
      "Pecahkan dan kocok telur di mangkuk, lalu orak-arik di wajan dengan sedikit garam.",
      "Sobek atau lipat keju menjadi potongan lebih kecil agar lebih cepat meleleh.",
      "Letakkan telur matang, keju, dan sisa sayuran di atas wrap.",
      "Panaskan sebentar dengan api kecil agar keju meleleh, lipat wrap, lalu sajikan.",
    ],
  },
  tutorial_003: {
    title: "Nasi Sarapan 5 Menit",
    description: "Sarapan manis cepat yang memakai sisa nasi dengan cairan, lemak, dan pemanis.",
    category: "Memasak",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "nasi merah matang",
      "air atau susu kedelai atau susu",
      "mentega atau margarin",
      "pemanis atau gula",
      "panci saus",
    ],
    steps: [
      "Masukkan nasi matang, cairan, dan mentega atau margarin ke panci.",
      "Panaskan sampai nasi panas dan sebagian besar cairan menguap.",
      "Aduk pemanis sampai tercampur rata.",
      "Sajikan di mangkuk dan tambahkan buah atau topping lain jika diinginkan.",
    ],
  },
  tutorial_004: {
    title: "Telur Orak-Arik Microwave",
    description:
      "Sarapan satu telur yang dibuat dengan microwave di cetakan silikon cupcake atau mug.",
    category: "Memasak",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "telur",
      "cetakan silikon cupcake atau mug",
      "keju opsional",
      "garam dan merica opsional",
      "mangkuk",
      "garpu",
      "microwave",
    ],
    steps: [
      "Pecahkan telur ke dalam mangkuk dan kocok dengan garpu.",
      "Campurkan tambahan seperti keju, susu, garam, atau merica.",
      "Tuang campuran ke cetakan silikon atau mug dan panaskan di microwave sekitar satu menit sambil diawasi agar tidak meluap.",
      "Biarkan agak dingin, lalu langsung makan.",
    ],
  },
  tutorial_005: {
    title: "Roti Telur Keju Mudah dengan Microwave",
    description:
      "Sarapan microwave menggunakan roti, telur, keju, dan mug untuk memasak cepat dengan sedikit cucian.",
    category: "Memasak",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "selembar roti",
      "telur",
      "keju parut",
      "sayuran cincang opsional",
      "bumbu opsional",
      "mug aman microwave",
    ],
    steps: [
      "Lipat roti ke dalam mug dan pecahkan telur di bagian tengah.",
      "Tambahkan keju parut dan topping tambahan.",
      "Panaskan di microwave sekitar 1 sampai 2 menit sampai telur matang dan keju meleleh.",
      "Sajikan panas langsung dari mug.",
    ],
  },
  tutorial_006: {
    title: "Taquito Sarapan",
    description:
      "Tortilla sarapan siap-simpan berisi telur orak-arik dan isian gurih lain, lalu dipanggang sampai renyah.",
    category: "Memasak",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "tortilla",
      "telur",
      "mentega",
      "bayam",
      "keju",
      "tomat kering",
      "sosis Italia atau protein lain",
      "daun bawang",
      "garam dan merica",
      "kertas panggang",
      "wajan",
      "spatula",
      "loyang oven",
      "salsa atau guacamole opsional",
    ],
    steps: [
      "Masak telur orak-arik dengan mentega, bumbui, lalu tambahkan bayam atau isian lain sampai semuanya siap digunakan.",
      "Letakkan isian secukupnya di tengah setiap tortilla tanpa mengisinya terlalu penuh.",
      "Gulung setiap tortilla menjadi silinder, letakkan sisi sambungan di bawah pada loyang berlapis, dan oles tipis mentega jika diinginkan.",
      "Panggang sampai kecokelatan dan renyah, atau gunakan air fryer atau wajan untuk hasil akhir renyah.",
      "Bekukan satu per satu untuk persiapan makan jika perlu, lalu panaskan kembali nanti dan sajikan dengan saus.",
    ],
  },
  tutorial_007: {
    title: "Oatmeal Instan Rumahan",
    description:
      "Campuran oatmeal kering untuk sarapan cepat di sekolah atau tempat kerja, dengan variasi apel-kayu manis opsional.",
    category: "Memasak",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "oat cepat matang",
      "susu bubuk tanpa lemak opsional",
      "garam",
      "pemanis atau gula",
      "kayu manis opsional",
      "potongan apel kering opsional",
      "kantong atau wadah penyimpanan",
      "air panas",
    ],
    steps: [
      "Masukkan oat, susu bubuk, garam, dan pemanis ke wadah penyimpanan; tambahkan kayu manis dan apel kering jika ingin versi apel-kayu manis.",
      "Tutup wadah dan kocok atau aduk sampai campuran kering merata.",
      "Saat siap dimakan, tuang campuran ke mangkuk, tambahkan air panas, aduk, dan diamkan beberapa menit sebelum disajikan.",
    ],
  },
  tutorial_008: {
    title: "Camilan Buah Mudah dan Enak",
    description: "Camilan buah tanpa dimasak dari potongan buah dan sedikit sirup maple.",
    category: "Memasak",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: ["apel", "pisang", "pir", "jeruk mandarin", "sirup maple"],
    steps: [
      "Iris pisang, apel, dan pir, lalu kupas atau pisahkan jeruk mandarin.",
      "Susun potongan buah bersama-sama dan tuangkan sirup maple tipis di atasnya.",
      "Sajikan segera sebagai camilan cepat atau pendamping sarapan.",
    ],
  },
  tutorial_009: {
    title: "Cara Membersihkan Sepatu",
    description:
      "Rutinitas pembersihan sepatu sederhana menggunakan pasta gigi untuk bagian atas dan pemutih encer untuk tali.",
    category: "Membersihkan",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "sepatu putih",
      "pasta gigi",
      "sikat gigi",
      "pemutih",
      "air",
      "mangkuk",
      "lap atau handuk",
    ],
    steps: [
      "Siapkan sepatu, pasta gigi, sikat gigi, pemutih, air, mangkuk, dan lap.",
      "Rendam tali sepatu dalam campuran pemutih dan air yang diencerkan saat Anda membersihkan sepatu.",
      "Gunakan sikat gigi basah dan pasta gigi untuk menggosok bagian sepatu yang kotor, lalu diamkan pasta sebentar.",
      "Bersihkan pasta gigi dengan air dan lap sampai permukaan terlihat bersih.",
      "Keringkan sepatu dan tali, lalu pasang kembali tali sepatu.",
    ],
  },
  tutorial_010: {
    title: "Cara Membersihkan Sepatu Tanpa Pembersih Sepatu",
    description:
      "Metode pembersihan sepatu murah yang memakai bubuk sabun dan sikat gigi lama sebagai pengganti pembersih khusus.",
    category: "Membersihkan",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: ["sepatu kotor", "bubuk sabun", "sikat gigi lama", "wastafel", "lap atau handuk"],
    steps: [
      "Gosok sol luar dengan bubuk sabun dan sikat gigi basah sampai kotoran terlihat terangkat.",
      "Sikat bagian atas sepatu dengan hati-hati agar bagian dalam sepatu tidak terlalu basah.",
      "Bersihkan ujung sepatu dengan lebih hati-hati dan lap kelembapan berlebih jika perlu.",
      "Lepas tali sepatu, gosok terpisah dengan sabun, dan bilas jika perlu.",
      "Biarkan semuanya di tempat hangat sampai kering sebelum dipakai kembali.",
    ],
  },
  tutorial_011: {
    title: "Membersihkan Kamar dengan Cepat dan Mudah",
    description:
      "Alur membersihkan kamar yang dimulai dari permukaan yang terlihat dan diakhiri dengan lantai serta pengaturan ulang.",
    category: "Merapikan",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "keranjang cucian",
      "kantong sampah",
      "lap pembersih",
      "vacuum",
      "minyak kayu atau pembersih permukaan opsional",
    ],
    steps: [
      "Mulai dengan merapikan tempat tidur agar kamar langsung terlihat lebih tertata.",
      "Kumpulkan dan pilah cucian, lalu kosongkan dan rapikan kembali meja samping tempat tidur.",
      "Kembalikan barang acak ke tempatnya dan bersihkan barang berantakan di meja rias atau permukaan meja.",
      "Pilah dan rapikan rak atau meja kerja, buang sampah dan elektronik yang tercecer.",
      "Sapu atau vacuum lantai dan pinggirannya, lalu simpan alat dan selesaikan pengaturan ulang.",
    ],
  },
  tutorial_012: {
    title: "Cara Membersihkan Birkenstock",
    description:
      "Panduan membersihkan sandal yang fokus pada footbed, dengan langkah opsional untuk merawat tali kulit.",
    category: "Membersihkan",
    difficulty: "Pemula",
    riskLevel: "rendah",
    materials: [
      "sandal Birkenstock",
      "sikat gigi lama",
      "soda kue",
      "air",
      "cangkir dan sendok",
      "lap kain",
      "pembersih kulit opsional",
    ],
    steps: [
      "Lap kotoran lepas dari footbed menggunakan kain lembap dan air sesedikit mungkin.",
      "Campur soda kue dengan air sampai menjadi pasta pembersih.",
      "Gosok footbed dengan pasta menggunakan sikat gigi lama dengan gerakan melingkar.",
      "Lap sisa pasta dengan kain lembap.",
      "Biarkan sandal kering semalaman di tempat gelap dan kering, jauh dari sinar matahari langsung.",
      "Opsional, rawat tali kulit dengan pembersih kulit yang diencerkan untuk menyelesaikan pemulihan.",
    ],
  },
};

export function localizeTutorial(tutorial, language) {
  if (!tutorial || normalizeStudyLanguage(language) !== "id") return tutorial;

  const translation = idTutorials[tutorial.id];
  if (!translation) return tutorial;

  return {
    ...tutorial,
    title: translation.title || tutorial.title,
    description: translation.description || tutorial.description,
    category: translation.category || tutorial.category,
    difficulty: translation.difficulty || tutorial.difficulty,
    riskLevel: translation.riskLevel || tutorial.riskLevel,
    imageAlt: translation.title || tutorial.imageAlt,
    materials: localizeMaterials(tutorial.materials || [], translation.materials || []),
    steps: localizeSteps(tutorial.steps || [], translation.steps || []),
  };
}

function localizeMaterials(materials, translations) {
  return materials.map((material, index) => ({
    ...material,
    name: translations[index] || material.name,
  }));
}

function localizeSteps(steps, translations) {
  return steps.map((step, index) => {
    const instruction = translations[index] || step.instruction;
    return {
      ...step,
      title: `Langkah ${step.stepNumber || index + 1}`,
      instruction,
      imageAlt: step.imageAlt ? `${step.imageAlt}` : `Langkah ${step.stepNumber || index + 1}`,
      keywords: Array.from(new Set([...(step.keywords || []), ...buildKeywords(instruction)])),
    };
  });
}

function buildKeywords(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 12);
}
