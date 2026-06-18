import React from "react";
import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo.jsx";

/* ====================== ORDER OF CHAPTERS (pager uses this) ====================== */
const order = [
  "1-insecticides","2-fungicides","3-biofertilizers","4-tank-mixing","5-nutrition",
  "6-biostimulants","7-soil-carbon","8-bio-inputs","9-mulching","10-ipm",
  "11-weeds","12-irrigation","13-soil-health","14-soil-test","15-faq"
];

/* ====================== CHAPTER CONTENT COMPONENTS ====================== */
/* 👉 Pattern to follow:
   function Chapter2() { return (<> …your content for Chapter 2… </>); }
   …then add '2-fungicides': Chapter2, inside chapterMap below.
*/

/* --- Chapter 1 — Insecticides (Classification, Groups) --- */
function Chapter1() {
  return (
    <>
    
      <p>
        Insecticides are chemicals or biological substances used to control insect pests. They are
        grouped by their <b>mode of action (MoA)</b> how they kill or affect the insect. Correct
        classification is important for <b>resistance management</b> (rotate groups to avoid resistance).
      </p>

      {/* Responsive YouTube (same embed style as home) */}
<div className="yt-wrap">
  <iframe
    src="https://www.youtube-nocookie.com/embed/JoBpn0c1b0M?si=QStdfUprDlR9OUcp"
    title="YouTube video player"
    loading="lazy"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
  />
</div>


      <h3>1️⃣ Acetylcholinesterase (AChE) Inhibitors</h3>
      <p><b>Mode of action:</b> Block the enzyme acetylcholinesterase → overstimulation of insect
         nerves → paralysis.</p>
      <ul>
        <li>
          <b>Group 1A — Carbamates.</b> <i>Examples:</i> Carbaryl, Carbofuran, Aldicarb, Methomyl.{" "}
          <i>Uses:</i> Chewing &amp; sucking pests in rice, maize, vegetables.{" "}
          <i>Notes:</i> Moderate persistence; higher mammalian toxicity.
        </li>
        <li>
          <b>Group 1B — Organophosphates.</b> <i>Examples:</i> Chlorpyrifos, Dimethoate,
          Quinalphos, Acephate, Phorate. <i>Uses:</i> Broad-spectrum; caterpillars, borers, sucking
          pests. <i>Notes:</i> More toxic to humans—use full protective gear.
        </li>
      </ul>

      <h3>2️⃣ GABA-gated Chloride Channel Antagonists</h3>
      <p><b>Mode of action:</b> Block GABA receptors → hyper-excitation → death.</p>
      <ul>
        <li><i>Examples:</i> Endosulfan (banned in India), Fipronil.</li>
        <li><i>Uses:</i> Stem borers, termites, leaf folders.</li>
        <li><i>Notes:</i> Fipronil widely used in rice &amp; sugarcane.</li>
      </ul>

      <h3>3️⃣ Sodium Channel Modulators</h3>
      <p><b>Mode of action:</b> Disrupt nerve impulses by keeping sodium channels open.</p>
      <ul>
        <li>
          <b>Group 3A — Pyrethroids.</b> <i>Examples:</i> Cypermethrin, Deltamethrin,
          Lambda-cyhalothrin, Fenvalerate. <i>Uses:</i> Lepidopteran pests (caterpillars, bollworms),
          sucking pests. <i>Notes:</i> Low mammalian toxicity, fast knockdown; resistance builds
          quickly—<b>rotate MoA groups</b>.
        </li>
      </ul>

      <h3>4️⃣ nAChR Agonists/Antagonists</h3>
      <p><b>Mode of action:</b> Bind to nicotinic acetylcholine receptors and overstimulate nerves.</p>
      <ul>
        <li>
          <b>Group 4A — Neonicotinoids.</b> <i>Examples:</i> Imidacloprid, Acetamiprid, Thiamethoxam,
          Clothianidin. <i>Uses:</i> Sucking pests (aphids, whiteflies, hoppers).{" "}
          <i>Notes:</i> Systemic—absorbed into plant tissues.
        </li>
        <li><b>Group 4C — Sulfoximines:</b> Sulfoxaflor.</li>
        <li><b>Group 4D — Butenolides:</b> Flupyradifurone.</li>
      </ul>

      <h3>5️⃣ Acetylcholine Receptor Allosteric Modulators</h3>
      <ul>
        <li><i>Examples:</i> Spinosad, Spinetoram (from <i>Saccharopolyspora</i> bacteria).</li>
        <li><i>Uses:</i> Caterpillars, thrips, fruit borers.</li>
        <li><i>Notes:</i> Often called “bio-insecticides”; low mammalian toxicity.</li>
      </ul>

      <h3>6️⃣ Chloride Channel Activators</h3>
      <ul>
        <li><i>Examples:</i> Abamectin, Emamectin benzoate (avermectins).</li>
        <li><i>Uses:</i> Caterpillars, mites, leaf miners.</li>
        <li><i>Notes:</i> Derived from soil bacteria (<i>Streptomyces</i>).</li>
      </ul>

      <h3>7️⃣ Insect Growth Regulators (IGRs)</h3>
      <p><b>Mode of action:</b> Interfere with growth, molting, or reproduction.</p>
      <ul>
        <li><b>Chitin Synthesis Inhibitors:</b> Diflubenzuron, Novaluron.</li>
        <li><b>Juvenile Hormone Analogues:</b> Pyriproxyfen, Methoprene.</li>
        <li><b>Ecdysone Agonists:</b> Tebufenozide.</li>
        <li><i>Uses:</i> Leaf folders, bollworms, whiteflies. <i>Notes:</i> Slower action but
          safer for natural enemies.</li>
      </ul>

      <h3>8️⃣ Ryanodine Receptor Modulators</h3>
      <ul>
        <li><i>Examples:</i> Chlorantraniliprole, Flubendiamide (Diamides).</li>
        <li><i>Uses:</i> Caterpillars, leaf folders, stem borers.</li>
        <li><i>Notes:</i> Very effective at low doses; long residual activity.</li>
      </ul>

      <h3>9️⃣ Mitochondrial Electron Transport Inhibitors</h3>
      <ul>
        <li><b>Group 12 — Complex II inhibitors:</b> Cartap hydrochloride.</li>
        <li><b>Group 13 — Uncouplers:</b> Chlorfenapyr.</li>
        <li><b>Group 20 — Site II disruptors:</b> Hydramethylnon.</li>
        <li><i>Uses:</i> Caterpillars &amp; soil pests.</li>
      </ul>

      <h3>🔟 Microbial &amp; Biological Insecticides</h3>
      <ul>
        <li><b>Bacillus thuringiensis (Bt):</b> effective against caterpillars.</li>
        <li><b>NPV (Nucleopolyhedrovirus):</b> for <i>Helicoverpa</i>, <i>Spodoptera</i>.</li>
        <li><b>Beauveria bassiana</b> &amp; <b>Metarhizium anisopliae</b> fungal biopesticides.</li>
      </ul>

      <h3>✅ Resistance Management Tips</h3>
      <ul>
        <li>Rotate insecticides from different MoA groups each season.</li>
        <li>Avoid repeated use of the same chemical.</li>
        <li>Use recommended doses—don’t under-dose (drives resistance).</li>
        <li>Combine with IPM: traps, natural enemies, cultural control.</li>
      </ul>

      <h3>⚠️ Safety Precautions</h3>
      <ul>
        <li>Wear gloves &amp; mask; avoid inhalation and skin contact.</li>
        <li>Never spray against the wind.</li>
        <li>Store chemicals away from food &amp; feed.</li>
        <li>Follow waiting periods before harvest.</li>
      </ul>
    </>
  );
}



/* --- Chapter 2 — Fungicides: Classification, Groups, Examples & Practical Use --- */
function Chapter2() {
  return (
    <>
      <p>
        Fungicides control fungal diseases (leaf spots, blights, mildews, rots, rusts). Proper group
        classification by <b>mode of action (FRAC)</b> helps manage resistance—rotate groups, avoid
        repeated use of the same MoA, and combine cultural controls.
      </p>

      <h3>1) FRAC (Mode of Action) Overview</h3>
      <p>
        FRAC groups fungicides by the biochemical site or process they affect (e.g., sterol biosynthesis,
        respiration, mitosis). Below are major FRAC groups used in practical agriculture.
      </p>

      <h3>2) Contact vs Systemic Fungicides</h3>
      <ul>
        <li>
          <b>Contact (protectant):</b> Remain on surface; prevent infection. Require thorough coverage and
          reapplication after rain. <i>(e.g., Copper oxychloride, Mancozeb)</i>
        </li>
        <li>
          <b>Systemic (penetrant/translaminar/locally systemic):</b> Absorbed into plant; protect new growth
          and may cure early infections. <i>(e.g., Triazoles, Strobilurins)</i>
        </li>
      </ul>

      <h3>3) Major FRAC Groups, Examples &amp; Notes</h3>
      <p><b>Group M — Multi-site contact fungicides</b></p>
      <ul>
        <li><b>Mode:</b> Multiple metabolic targets → low resistance risk.</li>
        <li><b>Examples:</b> Copper compounds (copper oxychloride, copper hydroxide), sulphur, mancozeb (dithiocarbamates), captan.</li>
        <li><b>Use:</b> General protection against many fungi; organic-compatible (sulphur, copper).</li>
        <li><b>Notes:</b> Good for resistance management; avoid phytotoxicity at high rates or hot weather.</li>
      </ul>

      <p><b>Group 3 — DMI (Triazoles; sterol biosynthesis inhibitors)</b></p>
      <ul>
        <li><b>Mode:</b> Inhibit 14α-demethylase → blocks ergosterol synthesis (cell membrane).</li>
        <li><b>Actives:</b> Tebuconazole, Propiconazole, Difenoconazole, Myclobutanil, Epoxiconazole.</li>
        <li><b>Uses:</b> Rusts, powdery mildew, leaf spots, blights (cereals, rice, vegetables).</li>
        <li><b>Resistance risk:</b> Medium–High. Rotate with other MoA groups.</li>
        <li><b>Notes:</b> Systemic; apply as curative/protectant depending on disease.</li>
      </ul>

      <p><b>Group 7 — SDHI (Succinate dehydrogenase inhibitors)</b></p>
      <ul>
        <li><b>Mode:</b> Inhibit mitochondrial respiration (Complex II).</li>
        <li><b>Examples:</b> Boscalid, Penthiopyrad, Fluxapyroxad.</li>
        <li><b>Uses:</b> Broad-spectrum; foliar blights, sclerotinia in pulses, cereal diseases.</li>
        <li><b>Resistance risk:</b> Medium–High; avoid repeated use, tank-mix with multi-site contacts.</li>
      </ul>

      <p><b>Group 11 — QoI (Strobilurins; respiration inhibitors)</b></p>
      <ul>
        <li><b>Mode:</b> Inhibit mitochondrial respiration at Qo site (Complex III).</li>
        <li><b>Examples:</b> Azoxystrobin, Trifloxystrobin, Pyraclostrobin.</li>
        <li><b>Uses:</b> Rusts, blights, powdery mildews (broad foliar control).</li>
        <li><b>Resistance risk:</b> High (single-site). Rotate and limit sprays.</li>
        <li><b>Notes:</b> Often used in pre-mix with triazoles or multi-site.</li>
      </ul>

      <p><b>Group 12 — Phenylamides / Aminopyridines</b></p>
      <ul>
        <li><b>Mode:</b> Inhibit RNA synthesis &amp; mycelial growth (oomycete-targeting).</li>
        <li><b>Examples:</b> Metalaxyl, Mefenoxam.</li>
        <li><b>Uses:</b> Oomycetes (downy mildew, late blight – <i>Phytophthora</i>, <i>Pythium</i>).</li>
        <li><b>Resistance risk:</b> Very high—use sparingly and in mixes.</li>
      </ul>

      <p><b>Group 4 — Benzimidazoles (Mitosis inhibitors)</b></p>
      <ul>
        <li><b>Mode:</b> Inhibit β-tubulin formation → prevent mitosis.</li>
        <li><b>Examples:</b> Carbendazim, Thiophanate-methyl.</li>
        <li><b>Uses:</b> Seed treatment and foliar applications; broad activity.</li>
        <li><b>Resistance risk:</b> High—widespread resistance in many pathogens.</li>
      </ul>

      <p><b>Group 17 — Anilinopyrimidines (Signal transduction inhibitors)</b></p>
      <ul>
        <li><b>Examples:</b> Cyprodinil, Pyrimethanil.</li>
        <li><b>Uses:</b> <i>Botrytis</i>, grey mould &amp; soft-rot pathogens.</li>
        <li><b>Resistance risk:</b> Medium–High.</li>
      </ul>

      <p><b>Group 1 — MBC / Nucleic acid synthesis inhibitors</b></p>
      <ul>
        <li><b>Notes:</b> Includes some older compounds; many phased out/restricted. Some overlap with benzimidazoles.</li>
      </ul>

      <p><b>Group 21 — Phenylpyrroles &amp; others</b></p>
      <ul>
        <li><b>Example:</b> Fludioxonil (common in seed treatments &amp; mixes).</li>
      </ul>

      <p><b>Group 29 — Aromatic Hydrocarbon derivatives</b></p>
      <ul>
        <li><b>Example:</b> Cyazofamid (late blight control in some crops).</li>
      </ul>

      <h3>4) Common Crop Examples &amp; Suggested Groups (practical)</h3>
      <ul>
        <li><b>Late Blight (Tomato/Potato):</b> QoI + DMI mixes; metalaxyl only for sensitive strains; multi-site protectants (mancozeb/copper) for prevention.</li>
        <li><b>Rusts (Cereal &amp; Pulses):</b> Triazoles (DMI) + QoI rotation; add multi-site protectants.</li>
        <li><b>Powdery Mildew:</b> Triazoles, QoI; organic options include sulphur &amp; <i>Trichoderma</i>.</li>
        <li><b>Anthracnose / <i>Colletotrichum</i>:</b> Protectants (mancozeb) + systemic triazoles for curative effect.</li>
        <li><b>Sclerotinia / White rot:</b> SDHIs + multi-site protectants.</li>
      </ul>

      <h3>5) Resistance Management (Key Practices)</h3>
      <ul>
        <li>Rotate fungicides with different FRAC groups; no back-to-back sprays of the same group.</li>
        <li>Use multi-site contacts (mancozeb, copper) as foundation sprays.</li>
        <li>Limit applications from high-risk groups (QoI, DMI, SDHI) per season.</li>
        <li>Use approved tank-mixtures (systemic + multi-site) to reduce resistance.</li>
        <li>Avoid under-dosing; follow label rates.</li>
        <li>Integrate cultural practices (drainage, resistant varieties, sanitation).</li>
      </ul>

      <h3>6) Application &amp; Timing Tips</h3>
      <ul>
        <li>Preventive sprays when conditions favour disease (high humidity, frequent rain).</li>
        <li>Coverage is critical for protectants—use appropriate nozzle/pressure.</li>
        <li>Protect susceptible stages (flowering, fruit set) and spray at first sign of disease.</li>
        <li>Use spreaders/wetters when allowed to improve wetting/retention (contact fungicides).</li>
        <li>Avoid incompatible mixes—do a jar test if unsure.</li>
      </ul>

      <h3>7) Tank-Mix Safety &amp; Compatibility</h3>
      <p><b>Order of addition (general):</b> Water → WSG/WG → WP → SC → EC → SL → Adjuvants.</p>
      <p><b>Note:</b> Always follow product label for compatibility and allowed mixes.</p>

      <h3>8) Integrated Disease Management (IDM)</h3>
      <ul>
        <li>Cultural controls: rotation, residue removal, proper spacing, irrigation to reduce leaf wetness.</li>
        <li>Use resistant/tolerant varieties where available.</li>
        <li>Monitoring: regular scouting, weather-based forecasts, early intervention.</li>
        <li>Biologicals: <i>Trichoderma</i> spp., <i>Bacillus subtilis</i>, and other antagonists.</li>
      </ul>

      <h3>9) Environmental &amp; Safety</h3>
      <ul>
        <li>Wear gloves, mask, long sleeves, eyewear when mixing/applying.</li>
        <li>Avoid drift; do not spray in windy conditions.</li>
        <li>Keep buffer zones near water bodies (some fungicides harm aquatic life).</li>
        <li>Respect PHI (pre-harvest interval) on the label.</li>
        <li>Store in a cool, dry, locked area away from food/animal feed.</li>
      </ul>

      <h3>10) Bio-Fungicides &amp; Organic Options</h3>
      <ul>
        <li><b>Trichoderma</b> spp. — seed treatment &amp; soil application; suppresses soil-borne pathogens.</li>
        <li><b>Bacillus subtilis</b> — foliar protection against leaf pathogens.</li>
        <li><b>Neem-based</b> formulations — antifungal properties for minor diseases.</li>
        <li><b>Use:</b> As multi-application strategy with cultural practices (IPM/organic).</li>
      </ul>

      <h3>11) Sample Spray Programs (Illustrative — adapt to crop &amp; label)</h3>
      <ul>
        <li><b>Cereals (Rust control):</b> Early: multi-site protectant (mancozeb) → at onset use DMI or QoI (rotate) → later SDHI if needed (observe label limits).</li>
        <li><b>Tomato (Late blight):</b> Preventive: Copper/mancozeb alternating with systemic (DMI or QoI); include metalaxyl only if pathogen is sensitive.</li>
      </ul>

      <h3>12) Quick Reference Table (Selected Fungicides)</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>FRAC Group</th>
              <th>Common Actives</th>
              <th>Formulations</th>
              <th>Main Uses</th>
              <th>Resistance Risk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Multi-site (M)</td>
              <td>Mancozeb, Copper</td>
              <td>WP, SC</td>
              <td>Broad protectant</td>
              <td>Low</td>
            </tr>
            <tr>
              <td>DMI (3)</td>
              <td>Tebuconazole, Propiconazole</td>
              <td>EC, SC</td>
              <td>Rusts, mildews</td>
              <td>Medium–High</td>
            </tr>
            <tr>
              <td>QoI (11)</td>
              <td>Azoxystrobin</td>
              <td>SC, WG</td>
              <td>Broad foliar</td>
              <td>High</td>
            </tr>
            <tr>
              <td>SDHI (7)</td>
              <td>Fluxapyroxad</td>
              <td>SC</td>
              <td>Foliar &amp; root</td>
              <td>Medium–High</td>
            </tr>
            <tr>
              <td>Phenylamides (12)</td>
              <td>Metalaxyl</td>
              <td>SL, WG</td>
              <td>Oomycetes</td>
              <td>Very High</td>
            </tr>
            <tr>
              <td>Benzimidazoles (4)</td>
              <td>Carbendazim</td>
              <td>WP</td>
              <td>Seed &amp; foliar</td>
              <td>High</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>13) Common Mistakes to Avoid</h3>
      <ul>
        <li>Repeated use of the same MoA group.</li>
        <li>Over-reliance on systemics (leads to resistance).</li>
        <li>Ignoring label PHI and pre-harvest restrictions.</li>
        <li>Tank-mixing incompatible products without testing.</li>
      </ul>
    </>
  );
}

/* --- Chapter 3 — Bio-fertilizers & Microbial Roles --- */
function Chapter3() {
  return (
    <>
      <p>
        Bio-fertilizers are living microorganisms that improve soil fertility and plant growth by
        fixing nutrients, mobilizing unavailable nutrients, or stimulating plant physiology. They’re
        eco-friendly alternatives or supplements to chemical fertilizers.
      </p>

      {/* Responsive YouTube */}
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/uRgehqH7uDg?si=Q1Sw9GMOiyIX0eQZ"
          title="Bio-fertilizers & Microbial Roles"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <h3>1) Major Categories of Bio-fertilizers</h3>

      <p><b>🔹 A. Nitrogen-fixing Microorganisms</b></p>
      <ul>
        <li>
          <b>Rhizobium</b> — Symbiotic nodules on legume roots (pulses, groundnut, soybean); fix
          ~50–200&nbsp;kg N/ha/yr. <i>Use:</i> seed treatment before sowing.
        </li>
        <li>
          <b>Azotobacter</b> — Free-living; produce auxins/vitamins; useful in cereals (wheat, maize, sorghum).
        </li>
        <li>
          <b>Azospirillum</b> — Associative; moderate N-fixation + root promotion; widely used in rice, maize, sugarcane.
        </li>
        <li>
          <b>Blue-Green Algae (BGA)</b> (<i>Anabaena, Nostoc</i>) — N-fixation in flooded rice; improves soil OM.
        </li>
        <li>
          <b>Azolla</b> (with <i>Anabaena azollae</i>) — Aquatic fern for paddies; fixes ~40–60&nbsp;kg N/ha.
        </li>
      </ul>

      <p><b>🔹 B. Phosphate-solubilizing Microorganisms (PSM)</b></p>
      <ul>
        <li><b>Bacteria:</b> <i>Bacillus megaterium</i>, <i>Pseudomonas striata</i></li>
        <li><b>Fungi:</b> <i>Aspergillus</i>, <i>Penicillium</i></li>
        <li><b>Benefit:</b> Solubilize P → better roots, flowering, seed formation. <i>Use:</i> soil/seed.
        </li>
      </ul>

      <p><b>🔹 C. Potassium &amp; Zinc Solubilizers</b> — <i>Frateuria aurantia</i> (K), <i>Bacillus</i> spp. (Zn); improve disease resistance &amp; fruit quality.</p>

      <p><b>🔹 D. Mycorrhiza (VAM)</b> — Fungal symbionts on roots; enhance P/micronutrient/water uptake; better drought/salt tolerance.</p>

      <p><b>🔹 E. Bio-control Agents</b> — <i>Trichoderma</i>, <i>Pseudomonas fluorescens</i>, <i>Bacillus subtilis</i> for pathogen suppression.</p>

      <p><b>🔹 F. PGPR</b> — <i>Pseudomonas</i>, <i>Bacillus</i>, <i>Enterobacter</i>; produce IAA/GA, siderophores; boost growth &amp; stress tolerance.</p>

      <p><b>🔹 G. Bio-stimulant Microbes</b> — Seaweed extracts, humic substances often combined with microbes to improve rooting &amp; uptake.</p>

      <h3>2) Roles of Major Microbes</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Microorganism</th>
              <th>Primary Role</th>
              <th>Secondary Benefits</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rhizobium</td>
              <td>N fixation in legumes</td>
              <td>Improves soil fertility</td>
            </tr>
            <tr>
              <td>Azotobacter</td>
              <td>Free-living N fixation</td>
              <td>Produces vitamins &amp; hormones</td>
            </tr>
            <tr>
              <td>Azospirillum</td>
              <td>N fixation &amp; root growth</td>
              <td>Enhances stress resistance</td>
            </tr>
            <tr>
              <td>Azolla + BGA</td>
              <td>N fixation in rice fields</td>
              <td>Improves soil organic matter</td>
            </tr>
            <tr>
              <td>PSM (Bacillus, Aspergillus)</td>
              <td>Solubilize phosphorus</td>
              <td>Enhance flowering &amp; yield</td>
            </tr>
            <tr>
              <td>K-solubilizers</td>
              <td>Mobilize potassium</td>
              <td>Disease resistance, fruit quality</td>
            </tr>
            <tr>
              <td>Zinc-solubilizers</td>
              <td>Make Zn available</td>
              <td>Enzyme activity, grain filling</td>
            </tr>
            <tr>
              <td>Mycorrhiza (VAM)</td>
              <td>P &amp; micronutrient uptake</td>
              <td>Stress/drought tolerance</td>
            </tr>
            <tr>
              <td>Trichoderma</td>
              <td>Bio-control of soil fungi</td>
              <td>Induces systemic resistance</td>
            </tr>
            <tr>
              <td>Pseudomonas fluorescens</td>
              <td>Root protection</td>
              <td>Promotes growth &amp; immunity</td>
            </tr>
            <tr>
              <td>Bacillus subtilis</td>
              <td>Foliar/soil disease suppression</td>
              <td>Improves nutrient uptake</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>3) Application Methods</h3>
      <ul>
        <li><b>Seed treatment:</b> Coat seeds with slurry (jaggery/starch + bio-fertilizer), shade-dry, sow.</li>
        <li><b>Soil application:</b> Mix with compost/FYM and broadcast near root zone.</li>
        <li><b>Root dipping (nursery):</b> Dip seedling roots in slurry before transplanting.</li>
        <li><b>Foliar spray:</b> For some PGPR/bio-control (e.g., <i>Trichoderma</i>, <i>Bacillus</i>).</li>
      </ul>

      <h3>4) Dosage &amp; Handling (Quick View)</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Context</th>
              <th>Typical Dose</th>
              <th>Handling &amp; Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Seed treatment</td>
              <td>200–250&nbsp;g per 10–12&nbsp;kg seed</td>
              <td>Coat evenly; shade-dry; sow immediately</td>
            </tr>
            <tr>
              <td>Soil application</td>
              <td>2–4&nbsp;kg/acre (with compost/FYM)</td>
              <td>Broadcast near root zone</td>
            </tr>
            <tr>
              <td>Storage</td>
              <td>—</td>
              <td>Keep &lt;25&nbsp;°C, dry, away from sun; use before expiry</td>
            </tr>
            <tr>
              <td>Compatibility</td>
              <td>—</td>
              <td>Do not mix directly with chemical pesticides/fungicides</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>5) Advantages</h3>
      <ul>
        <li>Reduce dependency on synthetic fertilizers; improve soil health &amp; microbial diversity.</li>
        <li>Increase nutrient-use efficiency and stress resistance.</li>
        <li>Cost-effective and eco-friendly.</li>
      </ul>

      <h3>6) Limitations / Precautions</h3>
      <ul>
        <li>Effectiveness depends on pH, organic matter, and moisture.</li>
        <li>Require proper storage and timely use; best with compost/FYM.</li>
        <li>Avoid mixing with strong chemical fertilizers/pesticides at application.</li>
      </ul>
    </>
  );
}

/* --- Chapter 4 — Tank Mixing Process (Insecticides, Fungicides, Fertilizers, Biostimulants) --- */
function Chapter4() {
  return (
    <>
      <p>
        Tank mixing means combining two or more agricultural inputs (pesticides, fungicides, foliar
        fertilizers, biostimulants, adjuvants) in one spray solution. Correct order, compatibility
        checks, and application practices are essential for effectiveness and crop safety.
      </p>

      {/* Responsive YouTube */}
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/Xv43MCjdr9w?si=on1-rixoFQUNdQGw"
          title="Tank Mixing Process"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <h3>1) Why Mixing Order Matters</h3>
      <ul>
        <li>Different formulations behave differently in water.</li>
        <li>Wrong order → precipitation, clumping, foaming, separation → nozzle clogging or reduced efficacy.</li>
        <li>Correct order ensures even dispersion, stability, and full performance.</li>
      </ul>

      <h3>2) Standard Mixing Order (W-A-L-E-S Rule)</h3>
      <p><b>Mnemonic:</b> <b>W-A-L-E-S</b> → <i>Wettable powders</i> → <i>Agitate / flowables</i> → <i>Liquids</i> → <i>Emulsifiables</i> → <i>Surfactants/adjuvants</i>.</p>
      <ol>
        <li>
          <b>W → WP, WDG/WG, DF:</b> need strong agitation to disperse.
        </li>
        <li>
          <b>A → Agitate; then add SC/SE/OD:</b> thick formulations need water present to suspend evenly.
        </li>
        <li>
          <b>L → Liquids (SL, SP, soluble concentrates):</b> dissolve fully and mix easily.
        </li>
        <li>
          <b>E → Emulsifiable concentrates (EC, EW, ME):</b> added after water-based products.
        </li>
        <li>
          <b>S → Surfactants, oils, adjuvants, micronutrients:</b> always last.
        </li>
      </ol>

      <h3>3) Example: Tank Mix for Vegetable Spray</h3>
      <ol>
        <li>Fill half tank with clean water.</li>
        <li>Add <b>Mancozeb (WP)</b> → stir well.</li>
        <li>Add <b>Emamectin Benzoate (SG/WDG)</b>.</li>
        <li>Add <b>Hexaconazole (SC)</b>.</li>
        <li>Add <b>Imidacloprid (SL)</b>.</li>
        <li>Add <b>Lambdacyhalothrin (EC)</b>.</li>
        <li>Add <b>spreader/sticker adjuvant</b> last.</li>
        <li>Top up remaining water while agitating.</li>
      </ol>

      <h3>4) Compatibility Guidelines</h3>
      <ul>
        <li>Do not mix more than 2–3 products unless manufacturer approves.</li>
        <li>Always follow label instructions for compatibility.</li>
        <li>
          <b>Jar Test:</b> mix small amounts in a jar with water; shake and observe for precipitate,
          clumps, heat, or separation. If stable, it’s likely safe to tank-mix.
        </li>
        <li>
          <b>pH:</b> Ideal spray solution pH is <b>5.5–6.5</b>. Avoid very alkaline water (reduces pesticide activity).
        </li>
      </ul>

      <h3>5) Formulation Abbreviations (common on labels)</h3>
      <ul>
        <li><b>WP</b> = Wettable Powder; <b>WDG/WG/DF</b> = Water-Dispersible Granule / Dry Flowable</li>
        <li><b>SC</b> = Suspension Concentrate; <b>SE</b> = Suspo-emulsion; <b>OD</b> = Oil Dispersion</li>
        <li><b>SL</b> = Soluble Liquid; <b>SP</b> = Soluble Powder</li>
        <li><b>EC</b> = Emulsifiable Concentrate; <b>EW/ME</b> = Emulsion in Water / Microemulsion</li>
        <li><b>CS</b> = Capsule Suspension; <b>GR</b> = Granule (soil application, not sprays)</li>
      </ul>

      <h3>6) Mixing with Fertilizers &amp; Biostimulants</h3>
      <ul>
        <li>Foliar fertilizers can be mixed, but avoid high salt concentration.</li>
        <li>Calcium often incompatible with sulfates/phosphates → precipitation.</li>
        <li>Chelated micronutrients (EDTA/EDDHA) are safer for mixing.</li>
        <li>Seaweed, humic acids, biostimulants: usually compatible—check label.</li>
      </ul>

      <h3>7) Mixing DOs &amp; DON’Ts</h3>
      <p><b>✅ Do</b></p>
      <ul>
        <li>Use clean, low-hardness water; pre-dissolve powders; maintain agitation.</li>
        <li>Spray immediately—do not store the tank mix overnight.</li>
      </ul>
      <p><b>❌ Don’t</b></p>
      <ul>
        <li>Mix herbicides with insecticides/fungicides unless label allows.</li>
        <li>Mix copper fungicides with strongly acidic fertilizers.</li>
        <li>Mix biologicals (<i>Trichoderma</i>, <i>Bacillus</i>) with strong chemicals (kills microbes).</li>
        <li>Add adjuvants first—<b>adjuvants are always last</b>.</li>
      </ul>

      <h3>8) Safety &amp; Environmental Precautions</h3>
      <ul>
        <li>Wear gloves, goggles, mask during mixing; work outdoors or well-ventilated.</li>
        <li>Avoid spillage into drains/water bodies; triple-rinse containers and dispose as per rules.</li>
      </ul>

      <h3>9) Quick Reference Table (Mixing Order)</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Step</th>
              <th>Formulation Type</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>WP, WDG, DF</td>
              <td>Mancozeb WP; Emamectin WDG</td>
            </tr>
            <tr>
              <td>2</td>
              <td>SC, SE, OD</td>
              <td>Hexaconazole SC; Chlorantraniliprole SC</td>
            </tr>
            <tr>
              <td>3</td>
              <td>SL, SP</td>
              <td>Imidacloprid SL; Glyphosate SL</td>
            </tr>
            <tr>
              <td>4</td>
              <td>EC, EW, ME</td>
              <td>Cypermethrin EC; Profenofos EC</td>
            </tr>
            <tr>
              <td>5</td>
              <td>Adjuvants/Oils/Micronutrients</td>
              <td>Sticker, spreader, Zn-EDTA</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>10) Common Farmer Mistakes</h3>
      <ul>
        <li>Mixing too many products “to save labor”.</li>
        <li>Using hard/muddy water; adding ECs first; not keeping agitation on.</li>
        <li>Storing leftover tank mix for the next day → reduced efficacy.</li>
      </ul>
    </>
  );
}

/* --- Chapter 5 — Nutritional Management in Crops --- */
function Chapter5() {
  return (
    <>
      <p>
        Good crop nutrition ensures higher yield, better quality, disease resistance, and soil
        health. Nutrients are classified into <b>Macronutrients</b>, <b>Secondary nutrients</b>, and{" "}
        <b>Micronutrients</b>. Each has a unique role, and their deficiency directly affects plant
        growth.
      </p>

      {/* Responsive YouTube - Role of NPK */}
      <h3>🎥 Role of NPK</h3>
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/ual2StYyIpg?si=jQzeO5bYlLMwI-Uu"
          title="Role of NPK in Crops"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      {/* Responsive YouTube - CMS */}
      <h3>🎥 Calcium, Magnesium &amp; Sulfur (CMS)</h3>
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/qvV2PrZ1XtA?si=Jc2A_duVcMoWKgtx"
          title="Calcium, Magnesium & Sulfur"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <h3>1) Macronutrients (Primary) – NPK</h3>

      <h4>1.1 Nitrogen (N)</h4>
      <ul>
        <li><b>Role:</b> Vegetative growth, chlorophyll, amino acids, proteins, nucleic acids.</li>
        <li><b>Deficiency:</b> Pale yellow older leaves, stunted growth, weak stems.</li>
        <li><b>Remedies:</b> Urea, Ammonium Sulfate, DAP; split application; foliar 2% urea.</li>
      </ul>

      <h4>1.2 Phosphorus (P)</h4>
      <ul>
        <li><b>Role:</b> Root growth, flowering, fruiting, energy transfer (ATP).</li>
        <li><b>Deficiency:</b> Purplish leaves, poor root growth, delayed flowering.</li>
        <li><b>Remedies:</b> DAP, SSP, Rock Phosphate; foliar 2% KH2PO4.</li>
      </ul>

      <h4>1.3 Potassium (K)</h4>
      <ul>
        <li><b>Role:</b> Disease resistance, drought tolerance, grain filling, fruit quality.</li>
        <li><b>Deficiency:</b> Leaf edge scorching, weak stems, poor fruit size/taste.</li>
        <li><b>Remedies:</b> MOP, SOP; foliar 1% KNO3.</li>
      </ul>

      <h3>2) Secondary Nutrients</h3>

      <h4>2.1 Calcium (Ca)</h4>
      <ul>
        <li><b>Role:</b> Cell wall strength, fruit cracking resistance, root/shoot tip growth.</li>
        <li><b>Deficiency:</b> Blossom end rot (tomato), bitter pit (apple).</li>
        <li><b>Remedies:</b> Gypsum, Lime, Calcium Nitrate; foliar 0.5% Ca(NO3)2.</li>
      </ul>

      <h4>2.2 Magnesium (Mg)</h4>
      <ul>
        <li><b>Role:</b> Central atom of chlorophyll, photosynthesis, enzyme activation.</li>
        <li><b>Deficiency:</b> Interveinal chlorosis, “Christmas tree” pattern.</li>
        <li><b>Remedies:</b> Magnesium Sulfate soil or 2% foliar spray.</li>
      </ul>

      <h4>2.3 Sulfur (S)</h4>
      <ul>
        <li><b>Role:</b> Protein & enzyme synthesis, oil content in oilseeds.</li>
        <li><b>Deficiency:</b> Yellowing of young leaves, reduced oil content.</li>
        <li><b>Remedies:</b> Gypsum, Ammonium Sulfate, elemental S; foliar 1% MgSO4.</li>
      </ul>

      <h3>3) Micronutrients</h3>
      <ul>
        <li><b>Zinc (Zn):</b> Little leaf (cotton), Khaira (rice). Remedy: ZnSO4 soil/foliar.</li>
        <li><b>Iron (Fe):</b> Young leaf chlorosis. Remedy: FeSO4, Fe-EDTA foliar.</li>
        <li><b>Manganese (Mn):</b> Grey speck in oats. Remedy: MnSO4 spray.</li>
        <li><b>Copper (Cu):</b> Citrus die-back. Remedy: Cu oxychloride, CuSO4.</li>
        <li><b>Boron (B):</b> Hollow stem (cauliflower), fruit cracking. Remedy: Borax, foliar spray.</li>
        <li><b>Molybdenum (Mo):</b> Whiptail in cauliflower. Remedy: Sodium molybdate foliar.</li>
        <li><b>Chlorine (Cl):</b> Rare; wilting/chlorosis. Remedy: Supplied via KCl.</li>
      </ul>

      <h3>4) Nutrient Deficiency Quick Table</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nutrient</th>
              <th>Key Role</th>
              <th>Deficiency Symptom</th>
              <th>Remedy</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>N</td><td>Leaf/stem growth</td><td>Yellow older leaves</td><td>Urea, DAP</td></tr>
            <tr><td>P</td><td>Root, flowering</td><td>Purple leaves</td><td>SSP, DAP</td></tr>
            <tr><td>K</td><td>Quality, stress tolerance</td><td>Leaf edge burn</td><td>MOP, SOP</td></tr>
            <tr><td>Ca</td><td>Cell wall strength</td><td>Blossom end rot</td><td>Gypsum, CaNO3</td></tr>
            <tr><td>Mg</td><td>Photosynthesis</td><td>Interveinal chlorosis</td><td>MgSO4</td></tr>
            <tr><td>S</td><td>Protein, oil</td><td>Yellow new leaves</td><td>Gypsum, AS</td></tr>
            <tr><td>Zn</td><td>Hormones/enzymes</td><td>Khaira in rice</td><td>ZnSO4</td></tr>
            <tr><td>Fe</td><td>Chlorophyll</td><td>Yellow young leaves</td><td>FeSO4, Fe-EDTA</td></tr>
            <tr><td>B</td><td>Flower/fruit set</td><td>Cracking fruits</td><td>Borax</td></tr>
            <tr><td>Mo</td><td>N fixation</td><td>Whiptail (cauliflower)</td><td>Na Molybdate</td></tr>
          </tbody>
        </table>
      </div>

      <h3>5) Best Nutrient Management Practices</h3>
      <ul>
        <li>Soil testing every 2–3 years (pH, OC, NPK, micros).</li>
        <li>Integrated Nutrient Management (INM): organic + inorganic fertilizers.</li>
        <li>Fertilizer timing: Basal (P, K, part N) → Top dressing (split N, some K).</li>
        <li>Foliar feeding for quick deficiency correction.</li>
        <li>Maintain soil organic carbon (0.75–1%) with FYM, compost, biochar.</li>
        <li>Avoid overuse of N (lodging, pest risk).</li>
        <li>Use biostimulants (seaweed, humic acid) to enhance uptake.</li>
      </ul>
    </>
  );
}

/* --- Chapter 6 — Bio-Stimulants in Agriculture: Roles, Benefits, and Applications --- */
function Chapter6() {
  return (
    <>
      <p>
        <b>Bio-stimulants</b> are natural or microbial substances that, when applied to crops or soil,
        enhance plant growth, nutrient use efficiency, stress tolerance, and overall yield—without
        acting as traditional fertilizers or pesticides.
      </p>

      <ul>
        <li>They do <b>not</b> supply NPK directly; instead they boost plant metabolic activity and uptake.</li>
        <li>Improve tolerance to <i>biotic</i> (diseases, pests) and <i>abiotic</i> (drought, salinity, heat) stresses.</li>
        <li>Eco-friendly and support <b>sustainable farming</b>.</li>
      </ul>

      {/* Videos */}
      <h3>🎥 Growth Regulators vs Bio-stimulants</h3>
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/3hJ0qGKN3oA?si=mNeoJA7RmRXwcS0z"
          title="Growth regulators vs bio stimulants"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <h3>🎥 Seaweed Extract</h3>
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/KmzGssAHlCM?si=hy0OC8JfyW2V74Ij"
          title="Seaweed extract"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <h3>🎥 Potassium Humate</h3>
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/hIkKj2Lkvs0?si=TUnqBWh6M4Q3dQZH"
          title="Potassium Humate"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <h3>🎥 Vermihume</h3>
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/t2cgSueVpQg?si=JbANahBsIfVq2mDr"
          title="Vermihume"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <h3>1) What Are Bio-Stimulants?</h3>
      <p>
        Bio-stimulants enhance <b>root growth</b>, <b>nutrient uptake</b>, <b>stress tolerance</b>,
        and overall crop performance by activating plant and soil microbial processes.
      </p>

      <h3>2) Role and Benefits of Bio-Stimulants</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Benefits</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Enhance root growth & root hairs</td>
              <td>Better water & nutrient absorption</td>
            </tr>
            <tr>
              <td>Stimulate plant metabolic processes</td>
              <td>Faster growth, stronger plants</td>
            </tr>
            <tr>
              <td>Increase nutrient use efficiency</td>
              <td>Lower chemical fertilizer need</td>
            </tr>
            <tr>
              <td>Improve soil microbial activity</td>
              <td>Healthier rhizosphere, better nutrient cycling</td>
            </tr>
            <tr>
              <td>Boost stress tolerance (drought/salinity/heat)</td>
              <td>Higher survival & yield under stress</td>
            </tr>
            <tr>
              <td>Enhance crop quality</td>
              <td>Bigger fruits, higher sugars, better shelf life</td>
            </tr>
            <tr>
              <td>Improve resistance to diseases & viruses</td>
              <td>Lower infection incidence/severity</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>3) Types of Bio-Stimulants and Their Roles</h3>

      <h4>A. Humic Acid</h4>
      <ul>
        <li><b>Source:</b> Decomposed organic matter (humus).</li>
        <li><b>Role:</b> Improves soil structure/aeration; increases micronutrient availability (Fe, Zn, Mn); stimulates roots & microbes.</li>
        <li><b>Benefits:</b> Deep roots, better water retention, higher nutrient absorption & productivity.</li>
      </ul>

      <h4>B. Fulvic Acid</h4>
      <ul>
        <li><b>Source:</b> Highly soluble fraction of humic substances.</li>
        <li><b>Role:</b> Chelates nutrients and transports them into cells; enhances photosynthesis & metabolism.</li>
        <li><b>Benefits:</b> Rapid uptake, better stress tolerance, high vigor & quality.</li>
      </ul>

      <h4>C. Seaweed Extracts</h4>
      <ul>
        <li><b>Source:</b> Marine macroalgae (e.g., kelp, <i>Ascophyllum nodosum</i>).</li>
        <li><b>Role:</b> Stimulate natural hormones (auxins, cytokinins, gibberellins); improve stress tolerance; enhance soil microbes.</li>
        <li><b>Benefits:</b> Strong roots/shoots, better flowering/fruit set/yield, improved pathogen/viral resilience.</li>
      </ul>

      <h4>D. Amino Acids</h4>
      <ul>
        <li><b>Source:</b> Protein hydrolysis or microbial fermentation.</li>
        <li><b>Role:</b> Building blocks for proteins/enzymes/hormones; support metabolism under stress.</li>
        <li><b>Benefits:</b> Faster recovery from heat/cold/drought, improved nutrient absorption, higher chlorophyll & growth.</li>
      </ul>

      <h4>E. Protein Hydrolysates</h4>
      <ul>
        <li><b>Source:</b> Hydrolyzed proteins (plant/animal origin).</li>
        <li><b>Role:</b> Stimulate growth hormones & enzyme activity; enhance roots and nutrient absorption.</li>
        <li><b>Benefits:</b> Better tolerance to abiotic stress, improved vigor & yield, stronger rhizosphere activity.</li>
      </ul>

      <h3>4) Why Bio-Stimulants Are Important in Drip Irrigation</h3>
      <ol>
        <li><b>Direct delivery to root zone:</b> maximizes uptake.</li>
        <li><b>Consistent nutrition:</b> small, regular doses reduce stress.</li>
        <li><b>Better fertilizer efficiency:</b> improved absorption from fertigation.</li>
        <li><b>Stress mitigation:</b> continuous supply supports drought/salinity/heat tolerance.</li>
        <li><b>Higher quality & yield:</b> stronger roots, better photosynthesis, resilient plants.</li>
      </ol>
      <p>
        <b>Recommended frequency:</b> once per week during active growth; increase during high heat, drought, or viral pressure.
      </p>

      <h3>5) Role in Combating Viruses</h3>
      <ul>
        <li>Do not kill viruses directly; they <b>strengthen plant defenses</b>.</li>
        <li><b>Mechanisms:</b></li>
        <ul>
          <li><b>Induced Systemic Resistance (ISR):</b> activates defense enzymes.</li>
          <li><b>Stronger cell walls:</b> harder for viruses to penetrate.</li>
          <li><b>Stress reduction:</b> healthier plants are less susceptible.</li>
          <li><b>Microbial support:</b> improved soil biology can suppress vectors.</li>
        </ul>
      </ul>
      <p><b>Result:</b> Lower incidence, reduced symptom severity, better recovery & yield under viral pressure.</p>

      <h3>6) Summary Table</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bio-Stimulant</th>
              <th>Role</th>
              <th>Benefits</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Humic Acid</td>
              <td>Improves soil structure, stimulates roots</td>
              <td>Stronger roots, better water/nutrient uptake</td>
            </tr>
            <tr>
              <td>Fulvic Acid</td>
              <td>Chelates & transports nutrients; boosts metabolism</td>
              <td>Rapid uptake, stress tolerance</td>
            </tr>
            <tr>
              <td>Seaweed Extract</td>
              <td>Hormone stimulation; stress tolerance</td>
              <td>Strong roots/shoots, better flowering, pathogen resilience</td>
            </tr>
            <tr>
              <td>Amino Acids</td>
              <td>Protein building; stress recovery</td>
              <td>More chlorophyll, growth, nutrient absorption</td>
            </tr>
            <tr>
              <td>Protein Hydrolysates</td>
              <td>Stimulate growth hormones; root development</td>
              <td>Abiotic stress tolerance, vigor, yield</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>✅ Key Takeaways</h3>
      <ul>
        <li>Bio-stimulants are <b>essential</b> for healthy, high-yield crops.</li>
        <li><b>Weekly</b> drip application improves efficiency & resilience.</li>
        <li>They strengthen plants naturally against stresses and viral pressure.</li>
        <li>Combining <b>humic/fulvic acids, seaweed, amino acids,</b> and <b>protein hydrolysates</b> gives synergistic benefits.</li>
      </ul>
    </>
  );
}

/* --- Chapter 7 — Soil Health & Organic Carbon Management --- */
function Chapter7() {
  return (
    <>
      <p>
        Healthy soil is the engine of agriculture supplying nutrients, water, and a living ecosystem
        that sustains crop productivity. Maintaining soil fertility and <b>soil organic carbon (SOC)</b>
        ensures long-term sustainability.
      </p>

      <h3>1) What is Soil Health?</h3>
      <p>
        Soil health is the capacity of soil to function as a <b>living ecosystem</b> that sustains plants,
        animals, and humans.
      </p>
      <ul>
        <li>Soil structure: crumbly, porous, well-drained</li>
        <li>Organic matter (humus)</li>
        <li>Nutrient availability</li>
        <li>Microbial activity (bacteria, fungi, actinomycetes)</li>
        <li>Balanced pH (6–7.5 for most crops)</li>
      </ul>

      <h3>2) Importance of Soil Organic Carbon (SOC)</h3>
      <p><b>SOC</b> = carbon stored in organic matter (roots, residues, manure).</p>
      <ul>
        <li>Improves soil structure &amp; porosity → better root penetration</li>
        <li>Enhances water retention &amp; drainage</li>
        <li>Reservoir of nutrients (slow release)</li>
        <li>Stimulates microbial activity (e.g., <i>Trichoderma</i>, <i>Azotobacter</i>, VAM)</li>
        <li>Buffers against acidity/alkalinity</li>
        <li>Reduces erosion; increases drought resilience</li>
      </ul>
      <p><b>Target SOC:</b> 0.75–1.5% (many Indian soils &lt; 0.5% → poor).</p>

      <h3>3) Practices to Improve Soil Organic Carbon</h3>
      <h4>3.1 Organic Manures</h4>
      <ul>
        <li>FYM, compost, vermicompost → increase humus</li>
        <li>Green manures (dhaincha, sunnhemp) incorporated into soil</li>
        <li>Biochar for long-term carbon storage</li>
      </ul>

      <h4>3.2 Crop Residue Management</h4>
      <ul>
        <li>Avoid burning—incorporate residues into soil</li>
        <li>Retains N, P, K, S &amp; adds organic matter</li>
      </ul>

      <h4>3.3 Cover Crops &amp; Crop Rotation</h4>
      <ul>
        <li>Legumes (pulses, cowpea, clover) fix N &amp; add carbon</li>
        <li>Rotation improves microbial diversity</li>
      </ul>

      <h4>3.4 Reduced Tillage</h4>
      <ul>
        <li>Excess ploughing oxidizes organic matter → carbon loss</li>
        <li>Minimum/No-till conserves carbon</li>
      </ul>

      <h4>3.5 Mulching</h4>
      <ul>
        <li>Straw/leaves/plastic conserve moisture</li>
        <li>Organic mulches add carbon upon decomposition</li>
      </ul>

      <h4>3.6 Bio-fertilizers</h4>
      <ul>
        <li><b>Azotobacter</b>, <b>Azospirillum</b> → N fixation</li>
        <li><b>PSB</b> → solubilize phosphorus</li>
        <li><b>VAM</b> → enhance P &amp; Zn absorption</li>
      </ul>

      <h3>4) Soil Fertility Management</h3>
      <h4>Soil Testing</h4>
      <ul>
        <li>Test every 2–3 years</li>
        <li>Parameters: pH, EC, Organic Carbon, Available N, P, K, S, Micronutrients</li>
        <li>Use the report for balanced fertilization</li>
      </ul>

      <h4>Lime &amp; Gypsum Application</h4>
      <ul>
        <li>Acidic soils (pH &lt; 5.5) → <b>lime</b></li>
        <li>Sodic soils (pH &gt; 8.5) → <b>gypsum</b></li>
      </ul>

      <h4>Integrated Nutrient Management (INM)</h4>
      <ul>
        <li>Combine chemical fertilizers + organics + biofertilizers</li>
      </ul>
      <p><b>Example:</b> 50% NPK (fertilizers) + 25% (FYM/compost) + 25% (biofertilizers/green manure)</p>

      <h3>5) Soil Degradation Problems &amp; Solutions</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Problem</th>
              <th>Cause</th>
              <th>Effect</th>
              <th>Remedy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Soil erosion</td>
              <td>Wind, water</td>
              <td>Loss of topsoil</td>
              <td>Contour farming, bunding, cover crops</td>
            </tr>
            <tr>
              <td>Salinity</td>
              <td>Excess irrigation, poor drainage</td>
              <td>White salt crust, stunted crops</td>
              <td>Leaching, gypsum application</td>
            </tr>
            <tr>
              <td>Acidification</td>
              <td>Overuse of ammonium fertilizers</td>
              <td>Low pH, Al toxicity</td>
              <td>Liming, organic manures</td>
            </tr>
            <tr>
              <td>Compaction</td>
              <td>Heavy machinery, overgrazing</td>
              <td>Poor root growth</td>
              <td>Deep ploughing, add organic matter</td>
            </tr>
            <tr>
              <td>Loss of SOC</td>
              <td>Residue burning, excess tillage</td>
              <td>Poor fertility</td>
              <td>Mulching, compost, reduced tillage</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>6) Role of Microbes in Soil Health</h3>
      <ul>
        <li><b>Rhizobium</b>: fixes atmospheric N in legumes</li>
        <li><b>Azotobacter</b> &amp; <b>Azospirillum</b>: free-living N fixers in cereals</li>
        <li><b>PSB</b>: solubilize P from insoluble forms</li>
        <li><b>VAM fungi</b>: increase root surface → better uptake of P, Zn, Cu</li>
        <li><b>Trichoderma</b>, <b>Pseudomonas</b>: suppress soil-borne diseases</li>
      </ul>

      <h3>7) Farmer Practices for Long-term Soil Health</h3>
      <ul>
        <li>Apply 8–10 tons FYM/compost per acre annually</li>
        <li>Do not burn residues—incorporate with a rotavator</li>
        <li>Use legume intercrops (e.g., pigeon pea + groundnut; maize + cowpea)</li>
        <li>Rotate cereals with legumes</li>
        <li>Use organic mulches in orchards</li>
        <li>Test soil regularly; follow balanced fertilization</li>
        <li>Use drip irrigation to avoid salt build-up</li>
      </ul>

      <h3>8) Key Takeaways</h3>
      <ul>
        <li>Soil health = physical + chemical + biological balance</li>
        <li>SOC is the backbone of fertility—build it via manures, residues, biochar, mulching</li>
        <li>Balance fertilizers with organics (INM)</li>
        <li>Protect against erosion, salinity, acidity</li>
        <li>Promote beneficial microbes for nutrient cycling</li>
      </ul>
    </>
  );
}


/* --- Chapter 8 — Role of Bio-fertilizers, Bio-fungicides & Bio-pesticides --- */
function Chapter8() {
  return (
    <>
      <p>
        Chemical inputs often disturb soil balance, reduce beneficial microbes, and leave residues.{" "}
        <b>Biological inputs</b> are eco-friendly, residue-free, and help restore soil health while
        protecting crops.
      </p>

      {/* YouTube video */}
      <h3>🎥 Introduction to Biological Inputs</h3>
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/uRgehqH7uDg?si=dOnCCC8eTEB06ezn"
          title="Bio-fertilizers, Bio-fungicides & Bio-pesticides"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <h3>1) Bio-fertilizers</h3>
      <p>Living microorganisms that enhance nutrient availability to plants.</p>

      <h4>1.1 Nitrogen-fixing Bacteria</h4>
      <ul>
        <li><b>Rhizobium:</b> Nodules on legume roots, fixes 50–200 kg N/ha/yr, crop-specific strains.</li>
        <li><b>Azotobacter:</b> Free-living; produces IAA, GA; improves germination & root growth.</li>
        <li><b>Azospirillum:</b> Associative with cereals/grasses; fixes N & promotes root elongation.</li>
        <li><b>BGA & Azolla:</b> Used in paddy; fix N and reduce urea by 25–30%.</li>
      </ul>

      <h4>1.2 Phosphate Solubilizers (PSM)</h4>
      <p><i>Bacillus, Pseudomonas, Aspergillus</i> release acids → dissolve insoluble P.</p>

      <h4>1.3 Potassium Solubilizing Bacteria (KSB)</h4>
      <p><i>Bacillus mucilaginosus, Frateuria aurantia</i> mobilize K → improve yield & quality.</p>

      <h4>1.4 Micronutrient Solubilizers</h4>
      <p>Zinc-solubilizing bacteria release Zn; Silicate-solubilizers mobilize silica → stronger cell walls.</p>

      <h4>1.5 Vesicular Arbuscular Mycorrhizae (VAM)</h4>
      <p>Symbiotic fungi colonize roots; extend hyphae → absorb P, Zn, Cu; improve drought resistance.</p>

      <h3>2) Bio-fungicides</h3>
      <p>Beneficial fungi or bacteria that suppress pathogens.</p>
      <ul>
        <li><b>Trichoderma spp.:</b> Controls soil-borne fungi; via mycoparasitism, competition, antibiosis.</li>
        <li><b>Pseudomonas fluorescens:</b> Produces antibiotics; controls damping off, wilt, sheath blight.</li>
        <li><b>Bacillus subtilis:</b> Lipopeptides; protects against foliar pathogens; safe foliar spray.</li>
        <li><b>Ampelomyces quisqualis:</b> Hyperparasite on powdery mildew fungus.</li>
      </ul>

      <h3>3) Bio-pesticides</h3>
      <p>Derived from bacteria, fungi, viruses, or plant extracts.</p>

      <h4>3.1 Bacterial</h4>
      <p><b>Bacillus thuringiensis (Bt):</b> Produces endotoxins toxic to caterpillars; used in cotton, maize, veg.</p>

      <h4>3.2 Fungal</h4>
      <ul>
        <li><b>Beauveria bassiana:</b> Controls whitefly, aphids, borers.</li>
        <li><b>Metarhizium anisopliae:</b> Controls termites, root grubs, hoppers.</li>
        <li><b>Verticillium lecanii:</b> Effective against aphids, jassids, thrips.</li>
      </ul>

      <h4>3.3 Viral</h4>
      <p>NPVs: e.g., <b>HaNPV</b> (Helicoverpa), <b>SlNPV</b> (Spodoptera). Specific, safe to non-targets.</p>

      <h4>3.4 Botanicals</h4>
      <p><b>Neem</b> (Azadirachtin, oil, kernel extract): growth regulator, antifeedant, repellent. Garlic, Chilli, Pongamia extracts also used.</p>

      <h3>4) Advantages of Biological Inputs</h3>
      <ul>
        <li>Eco-friendly, residue-free</li>
        <li>Cost-effective, improves biodiversity</li>
        <li>Reduce chemical input dependence</li>
        <li>Compatible with IPM</li>
        <li>Improves crop quality, export acceptance</li>
      </ul>

      <h3>5) Limitations</h3>
      <ul>
        <li>Slower than chemicals</li>
        <li>Sensitive to temperature, humidity, UV</li>
        <li>Shorter shelf life</li>
        <li>Need proper storage/handling</li>
      </ul>

      <h3>6) Best Practices for Farmers</h3>
      <ul>
        <li>Check expiry date of bio-products</li>
        <li>Apply in evening (UV-sensitive)</li>
        <li>Store at 4–25°C, away from sun</li>
        <li>Combine with FYM/compost</li>
        <li>Avoid mixing with strong chemicals</li>
        <li>Use preventively (before outbreaks)</li>
      </ul>

      <h3>7) Integrated Use</h3>
      <ul>
        <li>Bio-fertilizers → soil fertility</li>
        <li>Bio-fungicides → seed/soil/root protection</li>
        <li>Bio-pesticides → eco-friendly pest control</li>
        <li>Combine with reduced-dose chemicals (INM & IPM)</li>
      </ul>
    </>
  );
}

/* --- Chapter 9 — Mulching & Its Advantages --- */
function Chapter9() {
  return (
    <>
      <p>
        <b>Mulching</b> means covering the soil surface around crops with organic or synthetic
        materials. It acts as a protective shield for soil, improving moisture retention, weed
        control, soil temperature, and fertility.
      </p>

      <h3>1) Types of Mulching</h3>

      <h4>1.1 Organic Mulches</h4>
      <ul>
        <li>Crop residues: straw, paddy husk, sugarcane trash</li>
        <li>FYM &amp; compost</li>
        <li>Green leaves (Gliricidia, neem)</li>
        <li>Coir pith, sawdust, wood chips</li>
      </ul>
      <p>👉 <b>Pros:</b> Improves organic carbon, adds nutrients, eco-friendly</p>
      <p>👉 <b>Cons:</b> Needs replenishment, may harbor pests</p>

      <h4>1.2 Inorganic / Synthetic Mulches</h4>
      <ul>
        <li>Plastic films (black, silver, biodegradable)</li>
        <li>Polythene sheets (UV-stabilized, 25–50 microns)</li>
        <li>Gravel, pebbles, stones (orchards, landscaping)</li>
      </ul>
      <p>👉 <b>Pros:</b> Long-lasting, excellent weed/moisture control</p>
      <p>👉 <b>Cons:</b> Disposal issues (non-biodegradable)</p>

      <h4>1.3 Living Mulches (Cover Crops)</h4>
      <ul>
        <li>Legumes (cowpea, clover, sunhemp)</li>
        <li>Grown between main crops</li>
        <li>Fix nitrogen + protect soil</li>
      </ul>

      <h3>2) Benefits of Mulching</h3>
      <h4>2.1 Soil Moisture Conservation</h4>
      <ul>
        <li>Reduces evaporation 50–70%</li>
        <li>Consistent root moisture</li>
        <li>Key for rainfed areas</li>
      </ul>

      <h4>2.2 Temperature Regulation</h4>
      <p>Keeps soil cooler in summer, warmer in winter → better root activity.</p>

      <h4>2.3 Weed Suppression</h4>
      <p>Blocks sunlight → prevents weed germination, reduces weeding cost.</p>

      <h4>2.4 Improves Soil Fertility (Organic)</h4>
      <p>Decomposes → adds carbon, enhances microbial activity, nutrient cycling.</p>

      <h4>2.5 Erosion Control</h4>
      <p>Protects against wind/water erosion, prevents surface crusting.</p>

      <h4>2.6 Crop Yield &amp; Quality</h4>
      <p>
        Uniform conditions → better growth. Plastic mulch improves fruit size, earliness, and
        cleanliness (tomato, chilli, watermelon).
      </p>

      <h4>2.7 Pest &amp; Disease Management</h4>
      <p>
        Silver plastics repel aphids/whiteflies/thrips; organic mulches support beneficial microbes
        that suppress pathogens.
      </p>

      <h3>3) Practical Guidelines</h3>
      <h4>3.1 Plastic Mulch</h4>
      <ul>
        <li>25–30 micron for vegetables; 50 micron for orchards</li>
        <li>Black mulch → weed control</li>
        <li>Silver/black mulch → controls pests + weeds</li>
        <li>Lay on prepared soil before transplanting</li>
        <li>Use drip under mulch</li>
      </ul>

      <h4>3.2 Organic Mulch</h4>
      <ul>
        <li>Spread 5–10 cm layer around crops</li>
        <li>Avoid direct stem contact (rot risk)</li>
        <li>Renew after 2–3 months</li>
      </ul>

      <h4>3.3 Orchards</h4>
      <p>Mulch tree basins with straw/leaves → cuts water use 30–40%.</p>

      <h3>4) Crop-wise Benefits</h3>
      <ul>
        <li><b>Vegetables:</b> Plastic mulch → higher yield, fewer weeds</li>
        <li><b>Fruit crops:</b> Water saving, bigger fruits</li>
        <li><b>Plantations:</b> Organic mulch → moisture conservation, weed suppression</li>
        <li><b>Flowers:</b> Plastic mulch → bigger blooms, longer vase life</li>
      </ul>

      <h3>5) Economic Benefits</h3>
      <ul>
        <li>Save 30–50% irrigation water</li>
        <li>Reduce 2–3 weedings/season</li>
        <li>Yield boost 15–30% (crop dependent)</li>
        <li>Marketable quality improves</li>
      </ul>

      <h3>6) Limitations</h3>
      <ul>
        <li>Plastic disposal issues</li>
        <li>Organic mulch = labor intensive</li>
        <li>Possible rodents/insects if unmanaged</li>
      </ul>

      <h3>7) Best Practices</h3>
      <ul>
        <li>Prefer biodegradable mulch where possible</li>
        <li>Use drip + mulch for max efficiency</li>
        <li>Inspect mulch regularly</li>
        <li>In organic farming, use residues + green leaves</li>
        <li>Match mulch type to crop:
          <ul>
            <li>Plastic → vegetables, flowers</li>
            <li>Organic → orchards, plantations</li>
          </ul>
        </li>
      </ul>

      <h3>8) Key Takeaways</h3>
      <ul>
        <li>Mulching = low-cost, high-benefit</li>
        <li>Boosts water use efficiency, soil health, yield, quality</li>
        <li>Best with drip irrigation</li>
        <li>Choose type based on crop, climate, resources</li>
      </ul>
    </>
  );
}

/* --- Chapter 10 — Integrated Pest Management (IPM) --- */
function Chapter10() {
  return (
    <>
      <p>
        <b>Integrated Pest Management (IPM)</b> is a scientific, eco-friendly, and economical
        approach to manage pests using a combination of biological, cultural, mechanical, and
        chemical methods. The aim is to minimize pesticide use, reduce resistance, and protect the
        environment.
      </p>

      <h3>1) Principles of IPM</h3>
      <ol>
        <li>Prevention first → healthy crops resist pests better.</li>
        <li>Monitoring &amp; early detection → act before outbreaks.</li>
        <li>Use multiple methods → cultural, biological, mechanical, chemical in combination.</li>
        <li>Safe chemical use only when necessary (last option, rotated to prevent resistance).</li>
      </ol>

      <h3>2) Components of IPM</h3>

      <h4>2.1 Cultural Methods</h4>
      <ul>
        <li>Crop rotation (avoid continuous same crop).</li>
        <li>Intercropping (onion + chilli, maize + pigeon pea).</li>
        <li>Resistant/tolerant varieties.</li>
        <li>Timely sowing (e.g., early sorghum to escape shoot fly).</li>
        <li>Proper spacing &amp; nutrient management → healthier crops.</li>
      </ul>

      <h4>2.2 Mechanical &amp; Physical Methods</h4>
      <ul>
        <li>Hand-picking egg masses/larvae.</li>
        <li>Light traps (10–12/ha) for moths.</li>
        <li>Yellow sticky traps for aphids/whiteflies.</li>
        <li>Pheromone traps for monitoring/mass trapping (Helicoverpa, Spodoptera).</li>
        <li>Barrier crops (maize around cotton/chilli).</li>
        <li>Mulching to suppress weeds/pests.</li>
      </ul>

      <h4>2.3 Biological Methods</h4>
      <ul>
        <li>
          <b>Predators:</b> Ladybird beetle (aphids), Chrysoperla (whiteflies), spiders.
        </li>
        <li>
          <b>Parasitoids:</b> Trichogramma spp. (egg parasitoids for Helicoverpa, stem borer).
        </li>
        <li>
          <b>Pathogens (biopesticides):</b>
          <ul>
            <li><i>Bacillus thuringiensis</i> (Bt) → caterpillars.</li>
            <li><i>Beauveria bassiana</i>, <i>Metarhizium anisopliae</i> → sucking pests, borers.</li>
            <li>NPV (Nuclear Polyhedrosis Virus) → Helicoverpa, Spodoptera.</li>
          </ul>
        </li>
      </ul>

      <h4>2.4 Botanical Pesticides</h4>
      <ul>
        <li>Neem oil (0.5–3%) → repels/disrupts growth.</li>
        <li>Neem seed kernel extract (NSKE 5%).</li>
        <li>Pongamia oil, garlic extract.</li>
        <li>Less toxic to beneficial organisms.</li>
      </ul>

      <h4>2.5 Chemical Methods (Judicious Use)</h4>
      <ul>
        <li>Apply only when ETL (Economic Threshold Level) is crossed.</li>
        <li>Rotate insecticide groups to avoid resistance.</li>
        <li>Prefer selective pesticides (spare natural enemies).</li>
        <li>Avoid broad-spectrum sprays during flowering (protect pollinators).</li>
      </ul>

      <h3>3) Examples of ETL (Economic Threshold Level)</h3>
      <ul>
        <li>Rice stem borer: 10% dead hearts.</li>
        <li>Cotton bollworm: 5 larvae/plant or 10% damaged fruiting bodies.</li>
        <li>Chilli thrips: 20–25% leaf curling.</li>
        <li>Aphids in vegetables: 20% plants infested.</li>
      </ul>

      <h3>4) Advantages of IPM</h3>
      <ul>
        <li>Reduces pesticide residues in food.</li>
        <li>Preserves natural enemies of pests.</li>
        <li>Delays resistance development.</li>
        <li>Reduces input costs (less spraying).</li>
        <li>Improves soil, water, and environmental health.</li>
      </ul>

      <h3>5) Practical Guidelines for Farmers</h3>
      <ul>
        <li>✅ Monitor pests with traps &amp; field scouting.</li>
        <li>✅ Use seed treatment with <i>Trichoderma</i>/<i>Pseudomonas</i>.</li>
        <li>✅ Install pheromone traps (12/ha) &amp; sticky traps (8/ha).</li>
        <li>✅ Plant flowering refuges (marigold, sunflower) for beneficials.</li>
        <li>✅ Spray biopesticides/botanicals before chemicals.</li>
        <li>✅ Avoid incompatible tank mixes.</li>
        <li>✅ Promote area-wide/community pest management.</li>
      </ul>

      <h3>6) Crop-wise Example (Quick Reference)</h3>
      <ul>
        <li><b>Cotton:</b> Pheromone traps + neem sprays + Trichogramma + selective pesticides.</li>
        <li><b>Rice:</b> Light traps + resistant varieties + biocontrol + need-based spraying.</li>
        <li><b>Vegetables (Tomato, Chilli):</b> Yellow traps + neem oil + NPV + chemical rotation.</li>
        <li><b>Fruit crops (Mango, Pomegranate):</b> Orchard sanitation + sticky traps + biologicals + selective sprays.</li>
      </ul>

      <h3>7) Key Takeaways</h3>
      <ul>
        <li>IPM is not pesticide-free farming, but pesticide-smart farming.</li>
        <li>Combines traditional wisdom + modern science.</li>
        <li>Reduces costs and protects farmers’ health &amp; environment.</li>
      </ul>
    </>
  );
}

/* --- Chapter 11 — Weed Management --- */
function Chapter11() {
  return (
    <>
      <p>
        <b>Weeds</b> are unwanted plants that compete with crops for nutrients, water, light, and
        space. Effective weed management ensures high yields, reduces costs, and maintains soil
        health.
      </p>

      <h3>1) Why Weed Management is Important?</h3>
      <ul>
        <li>Weeds reduce crop yield by 30–60% (sometimes up to 80%).</li>
        <li>Act as alternate hosts for pests &amp; diseases.</li>
        <li>Cause difficulty in harvesting.</li>
        <li>Some release allelopathic chemicals that suppress crops.</li>
        <li>Increase costs (extra irrigation, wasted fertilizers).</li>
      </ul>

      <h3>2) Classification of Weeds</h3>

      <h4>2.1 Based on Life Cycle</h4>
      <ul>
        <li><b>Annuals:</b> Complete cycle in 1 season (Ex: Phyllanthus, Amaranthus).</li>
        <li><b>Biennials:</b> Two-year cycle (Ex: Wild carrot).</li>
        <li><b>Perennials:</b> Live many years; regenerate from roots/rhizomes (Ex: Cynodon, Cyperus).</li>
      </ul>

      <h4>2.2 Based on Habitat</h4>
      <ul>
        <li><b>Terrestrial:</b> Upland weeds (Parthenium, Euphorbia).</li>
        <li><b>Aquatic:</b> Water weeds (Eichhornia = water hyacinth, Hydrilla).</li>
      </ul>

      <h4>2.3 Based on Morphology</h4>
      <ul>
        <li><b>Grasses:</b> Narrow leaves, fibrous roots (Cynodon, Echinochloa).</li>
        <li><b>Sedges:</b> Triangular stems (Cyperus).</li>
        <li><b>Broad-leaved:</b> Wide leaves (Amaranthus, Parthenium).</li>
      </ul>

      <h3>3) Methods of Weed Management</h3>

      <h4>3.1 Cultural Methods</h4>
      <ul>
        <li>Proper land prep → deep ploughing exposes roots/rhizomes.</li>
        <li>Timely sowing helps crops escape weed flush.</li>
        <li>Crop rotation breaks weed cycles.</li>
        <li>Mulching suppresses weed germination.</li>
        <li>Cover crops shade soil and suppress weeds.</li>
      </ul>

      <h4>3.2 Mechanical Methods</h4>
      <ul>
        <li>Hand weeding / hoeing.</li>
        <li>Implements: conoweeder, wheel hoe, power weeder.</li>
        <li>Mowing/slashing in orchards &amp; plantations.</li>
        <li>Flooding (for some aquatic weeds).</li>
      </ul>

      <h4>3.3 Biological Methods</h4>
      <ul>
        <li>
          Insects/pathogens:
          <ul>
            <li><i>Cactoblastis cactorum</i> (insect) → prickly pear cactus.</li>
            <li><i>Zygogramma bicolorata</i> → controls Parthenium.</li>
          </ul>
        </li>
        <li>Still limited in India but eco-friendly.</li>
      </ul>

      <h4>3.4 Chemical Methods (Herbicides)</h4>
      <p>Most effective when combined with cultural/mechanical methods.</p>

      <h5>Types of Herbicides</h5>
      <ul>
        <li>
          <b>By time of application:</b>
          <ul>
            <li>Pre-plant: before sowing (Glyphosate, Paraquat).</li>
            <li>Pre-emergence: after sowing, before crop/weed germination (Pendimethalin, Atrazine).</li>
            <li>Post-emergence: after crop/weed germination (2,4-D, Imazethapyr).</li>
          </ul>
        </li>
        <li>
          <b>By selectivity:</b>
          <ul>
            <li>Selective: kill weeds but safe for crop (Atrazine in maize).</li>
            <li>Non-selective: kill all (Glyphosate).</li>
          </ul>
        </li>
        <li>
          <b>By mode of action:</b>
          <ul>
            <li>Contact: kill only touched parts (Paraquat).</li>
            <li>Systemic: absorbed &amp; translocated (Glyphosate, 2,4-D).</li>
          </ul>
        </li>
      </ul>

      <h3>4) Integrated Weed Management (IWM)</h3>
      <p>
        <b>IWM</b> = combining cultural, mechanical, biological, and chemical methods for sustainable
        control.
      </p>
      <ul>
        <li><b>Rice:</b> Puddling + conoweeder + pre-emergence herbicide (Butachlor).</li>
        <li><b>Maize:</b> Pendimethalin (pre) + hand weeding at 30 DAS.</li>
        <li><b>Horticultural crops:</b> Mulching + drip irrigation + Glyphosate in tree basins.</li>
      </ul>

      <h3>5) Common Herbicides in India (Quick Reference)</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Crop</th>
              <th>Pre-emergence</th>
              <th>Post-emergence</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rice</td>
              <td>Butachlor, Pretilachlor</td>
              <td>2,4-D, Bispyribac-sodium</td>
            </tr>
            <tr>
              <td>Maize</td>
              <td>Atrazine, Pendimethalin</td>
              <td>Tembotrione, Nicosulfuron</td>
            </tr>
            <tr>
              <td>Soybean</td>
              <td>Pendimethalin</td>
              <td>Imazethapyr</td>
            </tr>
            <tr>
              <td>Cotton</td>
              <td>Pendimethalin</td>
              <td>Pyrithiobac, Quizalofop</td>
            </tr>
            <tr>
              <td>Wheat</td>
              <td>Pendimethalin</td>
              <td>2,4-D, Metsulfuron</td>
            </tr>
            <tr>
              <td>Vegetables</td>
              <td>Pendimethalin</td>
              <td>Hand weeding preferred</td>
            </tr>
            <tr>
              <td>Orchards</td>
              <td>Oxyfluorfen, Diuron</td>
              <td>Glyphosate (non-selective)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>6) Safety Precautions</h3>
      <ul>
        <li>Follow label dosage &amp; timing.</li>
        <li>Avoid drift to non-target crops.</li>
        <li>Wear protective gear while spraying.</li>
        <li>No spraying in windy/rainy weather.</li>
        <li>Store herbicides away from seeds &amp; fertilizers.</li>
      </ul>

      <h3>7) Key Takeaways</h3>
      <ul>
        <li>Weeds can cause major yield losses if unmanaged.</li>
        <li>Integrated approach = best long-term solution.</li>
        <li>Choice of herbicide depends on crop, weed type, stage.</li>
        <li>Safety &amp; timing are crucial for effectiveness.</li>
      </ul>
    </>
  );
}

/* --- Chapter 12 — Irrigation & Water Management --- */
function Chapter12() {
  return (
    <>
      <p>
        <b>Water</b> is the lifeblood of agriculture. Efficient irrigation and proper water
        management help achieve higher yields, better quality produce, reduced input costs, and
        long-term soil health.
      </p>

      <h3>1) Importance of Water Management</h3>
      <ul>
        <li>Crops need water for germination, nutrient uptake, photosynthesis, and growth.</li>
        <li>
          Poor management leads to:
          <ul>
            <li><b>Under-irrigation:</b> stunted growth, low yield.</li>
            <li><b>Over-irrigation:</b> waterlogging, nutrient leaching, salinity.</li>
          </ul>
        </li>
        <li>Efficient use ensures <b>more crop per drop</b>.</li>
      </ul>

      <h3>2) Methods of Irrigation</h3>

      <h4>2.1 Surface Irrigation</h4>
      <ul>
        <li>Traditional (flooding, furrows, basins).</li>
        <li>Cheap but high water loss (40–60%).</li>
        <li>Best for rice, sugarcane, some orchards.</li>
      </ul>

      <h4>2.2 Drip Irrigation</h4>
      <ul>
        <li>Delivers water to root zone via emitters.</li>
        <li>Saves 40–60% water, boosts yield 20–30%.</li>
        <li>Reduces weeds (only root zone wetted).</li>
        <li>Suitable for vegetables, orchards, cotton, sugarcane.</li>
        <li>Can integrate with fertigation.</li>
      </ul>

      <h4>2.3 Sprinkler Irrigation</h4>
      <ul>
        <li>Sprays water like rainfall using nozzles.</li>
        <li>Uniform coverage; saves 30–40% water.</li>
        <li>Best for light soils, groundnut, vegetables, wheat, pulses.</li>
        <li>Avoid in windy weather.</li>
      </ul>

      <h4>2.4 Subsurface Irrigation</h4>
      <ul>
        <li>Water applied below soil through buried pipes.</li>
        <li>Expensive but very efficient.</li>
        <li>Mainly for greenhouse/high-value crops.</li>
      </ul>

      <h4>2.5 Advanced Methods</h4>
      <ul>
        <li>Rain-gun irrigation for large plantations.</li>
        <li>Automated/sensor/timer-based systems.</li>
        <li>Moisture sensors for precise scheduling.</li>
      </ul>

      <h3>3) Irrigation Scheduling</h3>
      <p>Critical crop stages when water must be applied:</p>
      <ul>
        <li><b>Rice:</b> panicle initiation, flowering.</li>
        <li><b>Wheat:</b> crown root initiation, flowering, grain filling.</li>
        <li><b>Maize:</b> tasseling, silking, grain filling.</li>
        <li><b>Cotton:</b> square formation, flowering, boll development.</li>
        <li><b>Vegetables:</b> flowering, fruit set, enlargement.</li>
      </ul>
      <p><b>Depends on:</b> soil type (sandy = frequent), climate (hot/dry = more), crop stage.</p>

      <h3>4) Water Quality in Agriculture</h3>
      <ul>
        <li>Good water → low salts, no toxins.</li>
        <li>Salinity → reduces germination &amp; yield.</li>
        <li>Sodicity → damages soil structure.</li>
        <li><b>EC:</b> &lt; 1.5 dS/m = good for most crops.</li>
      </ul>

      <h3>5) Water Conservation Techniques</h3>
      <ul>
        <li>Mulching (plastic/organic).</li>
        <li>Laser land leveling → saves 15–20% water.</li>
        <li>Alternate Wetting &amp; Drying (AWD) in rice.</li>
        <li>Rainwater harvesting → ponds, tanks.</li>
        <li>Drought-tolerant crop varieties.</li>
      </ul>

      <h3>6) Fertigation (Fertilizer + Irrigation)</h3>
      <ul>
        <li>Drip-fed nutrients = 90–95% efficiency.</li>
        <li>Saves 25–30% fertilizer cost.</li>
        <li>Prevents nutrient leaching.</li>
        <li>Fertilizers: urea, KNO₃, phosphoric acid, soluble micronutrients.</li>
      </ul>

      <h3>7) Problems in Irrigation</h3>
      <ul>
        <li><b>Waterlogging:</b> poor aeration, root rot.</li>
        <li><b>Salinity &amp; sodicity:</b> from over-irrigation, poor water quality.</li>
        <li><b>Inefficient systems:</b> waste &amp; higher costs.</li>
      </ul>

      <h3>8) Best Practices for Farmers</h3>
      <ul>
        <li>✅ Choose irrigation based on crop, soil, water availability.</li>
        <li>✅ Irrigate at critical stages.</li>
        <li>✅ Avoid over-irrigation to reduce disease &amp; nutrient loss.</li>
        <li>✅ Use drip + mulching for efficiency.</li>
        <li>✅ Harvest/store rainwater.</li>
        <li>✅ Test irrigation water regularly.</li>
      </ul>

      <h3>9) Key Takeaways</h3>
      <ul>
        <li>Efficient irrigation = more yield + water savings.</li>
        <li>Drip &amp; sprinkler are future-ready for water-scarce areas.</li>
        <li>Critical stage irrigation is more vital than frequency.</li>
        <li>Combine fertigation, mulching, rainwater harvesting for sustainability.</li>
      </ul>
    </>
  );
}

/* --- Chapter 13 — Soil Health Management --- */
function Chapter13() {
  return (
    <>
      <p>
        <b>Healthy soil = healthy crops = healthy farmers.</b> Soil is not just dirt; it is a living
        ecosystem of minerals, organic matter, microbes, water, and air that supports plant growth.
        Managing soil health ensures sustainable productivity, nutrient cycling, water efficiency,
        and environmental safety.
      </p>

      <h3>1) What is Soil Health?</h3>
      <ul>
        <li>
          Soil health = capacity of soil to function as a living ecosystem to sustain plants,
          animals, and humans.
        </li>
        <li>
          <b>Healthy soil must have:</b>
          <ul>
            <li>Physical: good structure, porosity, water-holding capacity</li>
            <li>Chemical: balanced nutrients, proper pH, low toxicity</li>
            <li>Biological: active microbes, high organic carbon</li>
          </ul>
        </li>
      </ul>

      <h3>2) Key Indicators of Soil Health</h3>
      <ol>
        <li>Soil Organic Carbon (SOC) → min 0.75–1%</li>
        <li>Soil pH → 6.0–7.5 for most crops</li>
        <li>Electrical Conductivity (EC) → &lt; 1.5 dS/m</li>
        <li>Nutrient levels → balanced NPK, Ca, Mg, S, Zn, Fe, B, Mn, Cu, Mo</li>
        <li>Microbial activity → high enzyme activity, earthworms present</li>
        <li>Bulk density ~1.3 g/cm³ (supports roots)</li>
      </ol>

      <h3>3) Problems Affecting Soil Health</h3>
      <ul>
        <li>Declining organic carbon (residue burning, excess chemicals)</li>
        <li>Soil erosion (water/wind)</li>
        <li>Salinity &amp; sodicity (poor irrigation water)</li>
        <li>Soil compaction (heavy machinery)</li>
        <li>Imbalanced fertilization (too much N, lack of micros)</li>
        <li>Loss of microbial diversity (pesticide abuse)</li>
      </ul>

      <h3>4) Practices to Improve &amp; Maintain Soil Health</h3>

      <h4>4.1 Organic Matter Management</h4>
      <ul>
        <li>Add FYM, compost, green manure, residues</li>
        <li>Use vermicompost for microbes</li>
        <li>Avoid residue burning → incorporate instead</li>
      </ul>

      <h4>4.2 Balanced Nutrient Management</h4>
      <ul>
        <li>Follow soil test recommendations</li>
        <li>Use INM (chemical + organic + biofertilizers)</li>
        <li>Avoid blanket urea/DAP use</li>
      </ul>

      <h4>4.3 Soil Carbon Improvement</h4>
      <ul>
        <li>Apply organics regularly</li>
        <li>Grow cover crops/green manures (sunhemp, dhaincha, cowpea)</li>
        <li>Use conservation tillage</li>
      </ul>

      <h4>4.4 Biological Health</h4>
      <ul>
        <li>Apply biofertilizers (Rhizobium, Azotobacter, PSB, VAM)</li>
        <li>Apply biofungicides (Trichoderma, Pseudomonas)</li>
        <li>Avoid indiscriminate pesticide use</li>
      </ul>

      <h4>4.5 Soil Physical Health</h4>
      <ul>
        <li>Crop rotation &amp; intercropping</li>
        <li>Mulching for moisture</li>
        <li>Contour bunding/terracing in hills</li>
        <li>Avoid overuse of heavy machinery</li>
      </ul>

      <h4>4.6 Salinity &amp; Sodicity Management</h4>
      <ul>
        <li>Apply gypsum in sodic soils (Ca replaces Na)</li>
        <li>Use organic matter to improve structure</li>
        <li>Ensure good drainage</li>
        <li>Adopt salt-tolerant varieties</li>
      </ul>

      <h3>5) Soil Health Card (India)</h3>
      <ul>
        <li>Govt issues SHC to farmers every 2 years</li>
        <li>Shows pH, EC, organic carbon, macro, secondary, micronutrients</li>
        <li>Gives crop-specific fertilizer advice</li>
      </ul>

      <h3>6) Role of Soil Microorganisms</h3>
      <ul>
        <li>N fixers (Rhizobium, Azotobacter) → supply nitrogen</li>
        <li>PSB → release phosphorus</li>
        <li>VAM fungi → boost P uptake, drought tolerance</li>
        <li>Trichoderma, Pseudomonas → suppress soil pathogens</li>
        <li>Earthworms → improve aeration, organic matter breakdown</li>
      </ul>

      <h3>7) Farmer-Friendly Practices</h3>
      <ul>
        <li>✅ Add FYM/compost/vermicompost every season</li>
        <li>✅ Do soil testing before fertilizer use</li>
        <li>✅ Avoid excess urea/DAP</li>
        <li>✅ Incorporate residues into soil</li>
        <li>✅ Grow cover crops in off-season</li>
        <li>✅ Rotate legumes with cereals</li>
        <li>✅ Use biofertilizers with reduced chemicals</li>
      </ul>

      <h3>8) Benefits of Soil Health Management</h3>
      <ul>
        <li>Higher yields with lower input costs</li>
        <li>Better water-use efficiency</li>
        <li>Less dependency on chemicals</li>
        <li>Long-term fertility &amp; sustainability</li>
        <li>Healthy soil → healthy food → healthy people</li>
      </ul>

      <h3>9) Key Takeaways</h3>
      <ul>
        <li>Soil = living system, not dirt</li>
        <li>Balance physical + chemical + biological health</li>
        <li>Organic matter + biofertilizers + balanced nutrients = sustainable soil</li>
        <li>Protect soil today → secure farming for tomorrow</li>
      </ul>
    </>
  );
}

/* --- Chapter 14 — Basics of Soil Testing --- */
function Chapter14() {
  return (
    <>
      <p>
        <b>Soil is the foundation of farming.</b> Fertilizer application without soil testing leads
        to wastage, poor yields, and long-term soil degradation. Soil testing helps farmers
        understand fertility status, detect nutrient deficiencies, and take corrective measures.
      </p>

      {/* YouTube Video */}
      <div className="yt-wrap">
        <iframe
          src="https://www.youtube-nocookie.com/embed/aYZhzvOsPp4?si=2irFSQQHEeofmk4i"
          title="Soil Testing Basics"
          loading="lazy"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <h3>1) Importance of Soil Testing</h3>
      <ul>
        <li>Soil is the base of farming systems.</li>
        <li>Without testing, fertilizer use causes:
          <ul>
            <li>Wastage of inputs</li>
            <li>Poor crop yields</li>
            <li>Soil degradation (salinity, acidity, micronutrient deficiency)</li>
          </ul>
        </li>
        <li><b>Benefits of soil testing:</b> fertility status, detect deficiencies, fertilizer/bio-stimulant recommendations, higher yield, lower cost, environment safety.</li>
      </ul>

      <h3>2) Steps in Soil Testing</h3>
      <ol>
        <li>
          <b>Soil Sample Collection</b>
          <ul>
            <li>Take 5–10 spots in zig-zag pattern.</li>
            <li><b>Depth:</b> 0–15 cm for field crops, 0–30 cm for plantations.</li>
            <li>Remove litter, mix samples, prepare ½ kg composite sample.</li>
            <li>Send to a recognized soil testing lab.</li>
          </ul>
        </li>
        <li>
          <b>Laboratory Analysis</b>
          <ul>
            <li>pH &amp; EC (salinity)</li>
            <li>Organic Carbon (OC)</li>
            <li>Primary nutrients (N, P, K)</li>
            <li>Secondary (Ca, Mg, S)</li>
            <li>Micronutrients (Zn, Fe, Mn, Cu, B, Mo)</li>
          </ul>
        </li>
      </ol>

      <h3>3) Key Parameters in a Soil Test Report</h3>

      <h4>A. Soil pH</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>pH Value</th><th>Soil Reaction</th><th>Effect</th><th>Corrective Measure</th></tr>
          </thead>
          <tbody>
            <tr><td>&lt; 5.5</td><td>Strongly acidic</td><td>Poor P, Ca, Mg availability</td><td>Lime/dolomite</td></tr>
            <tr><td>5.5–6.5</td><td>Moderately acidic</td><td>Good for most crops</td><td>Liming if needed</td></tr>
            <tr><td>6.5–7.5</td><td>Neutral</td><td>Optimum</td><td>Maintain with organics</td></tr>
            <tr><td>7.5–8.5</td><td>Moderately alkaline</td><td>Zn, Fe deficiency</td><td>Gypsum + organics</td></tr>
            <tr><td>&gt; 8.5</td><td>Strongly alkaline/sodic</td><td>Poor structure, salinity</td><td>Gypsum + leaching</td></tr>
          </tbody>
        </table>
      </div>

      <h4>B. Electrical Conductivity (EC)</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>EC Value (dS/m)</th><th>Condition</th><th>Effect</th><th>Corrective Measure</th></tr>
          </thead>
          <tbody>
            <tr><td>&lt; 1.0</td><td>Normal</td><td>Safe for crops</td><td>Maintain organics</td></tr>
            <tr><td>1.0–2.0</td><td>Slightly saline</td><td>Yield loss in sensitive crops</td><td>Tolerant crops, irrigation</td></tr>
            <tr><td>2.0–4.0</td><td>Moderately saline</td><td>Poor growth</td><td>Gypsum + drainage</td></tr>
            <tr><td>&gt; 4.0</td><td>Highly saline</td><td>Crop failure likely</td><td>Reclamation with gypsum + drainage</td></tr>
          </tbody>
        </table>
      </div>

      <h4>C. Organic Carbon (OC)</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>OC %</th><th>Status</th><th>Corrective Measures</th></tr>
          </thead>
          <tbody>
            <tr><td>&lt; 0.5</td><td>Low</td><td>Add FYM, compost, green manures</td></tr>
            <tr><td>0.5–0.75</td><td>Medium</td><td>Regular addition of organics</td></tr>
            <tr><td>&gt; 0.75</td><td>High</td><td>Maintain with residues, manures</td></tr>
          </tbody>
        </table>
      </div>

      <h4>D. Macronutrients (N, P, K)</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Nutrient</th><th>Low</th><th>Medium</th><th>High</th><th>Corrective Measures</th></tr>
          </thead>
          <tbody>
            <tr><td>N</td><td>&lt; 280</td><td>280–560</td><td>&gt; 560</td><td>Urea, ammonium sulfate, organic N</td></tr>
            <tr><td>P</td><td>&lt; 10</td><td>10–25</td><td>&gt; 25</td><td>SSP, DAP, rock phosphate</td></tr>
            <tr><td>K</td><td>&lt; 108</td><td>108–280</td><td>&gt; 280</td><td>MOP, SOP, wood ash</td></tr>
          </tbody>
        </table>
      </div>

      <h4>E. Secondary Nutrients</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Nutrient</th><th>Deficiency Symptom</th><th>Corrective Measure</th></tr>
          </thead>
          <tbody>
            <tr><td>Calcium</td><td>Blossom-end rot in tomato</td><td>Lime, gypsum</td></tr>
            <tr><td>Magnesium</td><td>Yellowing between veins</td><td>Dolomite, MgSO₄</td></tr>
            <tr><td>Sulphur</td><td>Uniform leaf yellowing</td><td>Gypsum, ammonium sulfate</td></tr>
          </tbody>
        </table>
      </div>

      <h4>F. Micronutrients</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Nutrient</th><th>Deficiency Symptom</th><th>Corrective Measure</th></tr>
          </thead>
          <tbody>
            <tr><td>Zinc</td><td>Stunted growth, small leaves</td><td>Zinc sulfate foliar spray</td></tr>
            <tr><td>Iron</td><td>Yellowing of young leaves</td><td>Ferrous sulfate spray, chelates</td></tr>
            <tr><td>Manganese</td><td>Interveinal chlorosis</td><td>Manganese sulfate spray</td></tr>
            <tr><td>Copper</td><td>Dieback in citrus, poor growth</td><td>Copper sulfate, Bordeaux mix</td></tr>
            <tr><td>Boron</td><td>Hollow stem, poor fruit set</td><td>Borax, boric acid</td></tr>
            <tr><td>Molybdenum</td><td>Whiptail in cauliflower</td><td>Ammonium molybdate</td></tr>
          </tbody>
        </table>
      </div>

      <h3>4) General Corrective Guidelines</h3>
      <ul>
        <li>Acidic soils → lime/dolomite + organics</li>
        <li>Alkaline soils → gypsum + green manures + acid fertilizers via drip</li>
        <li>Low organic carbon → FYM, compost, crop residues</li>
        <li>Nutrient deficiencies → apply right fertilizer (soil, foliar, drip)</li>
        <li>Saline soils → gypsum + drainage + salt-tolerant crops</li>
      </ul>

      <h3>5) Example: Report Interpretation</h3>
      <ul>
        <li>pH = 8.2 → Moderately alkaline → gypsum</li>
        <li>EC = 2.5 → Moderately saline → drainage + gypsum</li>
        <li>OC = 0.35% → Low → add FYM, compost</li>
        <li>N = 220 kg/ha → Low → split N fertilizers</li>
        <li>P = 15 kg/ha → Medium → moderate P dose</li>
        <li>K = 95 kg/ha → Low → apply MOP</li>
        <li>Zinc deficient → ZnSO₄ @ 25 kg/ha (once in 2 yrs)</li>
      </ul>

      <h3>6) Farmer-Friendly Tips</h3>
      <ul>
        <li>✅ Test soil once every 2–3 years</li>
        <li>✅ Use recognized labs for accuracy</li>
        <li>✅ Correct deficiencies with integrated nutrient management</li>
        <li>✅ Record results for each field to track improvements</li>
      </ul>
    </>
  );
}


/* --- Chapter 15 — Farmer’s FAQ Corner: Quick Solutions to Common Crop Problems --- */
function Chapter15() {
  return (
    <>
      <p>
        <b>“Become the doctor for your own crops.”</b> Every farmer faces doubts in the field — why
        leaves turn yellow, flowers drop, or plants wilt after watering. Use this quick-reference
        FAQ as your first-aid guide to diagnose problems and choose practical solutions.
      </p>

      <h3>🌱 Crop Growth &amp; Nutrition</h3>
      <ol start={1}>
        <li>
          <b>Leaves turning yellow?</b> Mainly nitrogen deficiency, poor drainage, or root damage.
          Apply urea/organic manure in split doses and fix waterlogging.
        </li>
        <li>
          <b>Slow growth / stunting?</b> Poor soil fertility, nematodes, or micronutrient deficiency.
          Add balanced fertilizers + organic matter; inspect roots.
        </li>
        <li>
          <b>Flower buds dropping?</b> Heat/drought stress or boron deficiency. Spray boron and
          irrigate regularly.
        </li>
        <li>
          <b>Small fruits despite good flowering?</b> Lack of K and Ca. Apply MOP/SOP to soil +
          foliar calcium nitrate.
        </li>
        <li>
          <b>No response to fertilizers?</b> If soil health is poor, roots injured, or pests/disease
          present, nutrients won’t uptake. Fix soil &amp; pest issues first.
        </li>
        <li>
          <b>Raise yield without excess fertilizer?</b> Balanced nutrients + weekly bio-stimulants.
          Overuse burns roots and reduces yield.
        </li>
        <li>
          <b>Leaves curling up/down?</b> Viral infection, sucking pests, or imbalance. Control
          vectors + foliar micronutrients.
        </li>
        <li>
          <b>Sudden wilt &amp; death?</b> Often Fusarium/Rhizoctonia wilt. Improve drainage, apply
          <i> Trichoderma</i>, avoid overwatering.
        </li>
        <li>
          <b>Chrysanthemum wilting &amp; dying?</b> Soil-borne wilt. Uproot infected plants; soil
          treat with fungicide/<i>Trichoderma</i>; rotate crops.
        </li>
        <li>
          <b>Early deficiency signs?</b> Yellowing (N), purple leaves (P), burnt edges (K), pale new
          leaves (Fe/Zn), fruit cracking (B). Confirm via soil/leaf test.
        </li>
      </ol>

      <h3>🐛 Pests &amp; Diseases</h3>
      <ol start={11}>
        <li>
          <b>Identify pest attack early?</b> Check leaf undersides for insects, curling, holes,
          sticky honeydew, distorted growth.
        </li>
        <li>
          <b>Fruit borers (tomato/chilli/cotton)?</b> Pheromone traps, remove infested fruits, spray
          emamectin benzoate.
        </li>
        <li>
          <b>Thrips, aphids, whiteflies?</b> Sticky traps + neem oil; rotate systemic insecticides.
        </li>
        <li>
          <b>TLCV (tomato leaf curl virus)?</b> No cure. Rogue infected plants, control whiteflies,
          use tolerant varieties.
        </li>
        <li>
          <b>Tospovirus (ring spots, necrosis)?</b> Remove infected plants; control thrips; avoid
          continuous tomato/chilli.
        </li>
        <li>
          <b>Fungal wilt in tomato/chilli?</b> Resistant varieties, <i>Trichoderma</i> in nursery,
          avoid excess irrigation.
        </li>
        <li>
          <b>Powdery mildew / leaf spot?</b> Mancozeb, carbendazim, or triazoles; rotate chemistries.
        </li>
        <li>
          <b>Manage viruses without cure?</b> Rogue + vector control (thrips/aphids/whiteflies) +
          tolerant seeds.
        </li>
        <li>
          <b>Spray fungicide on leaves for wilt?</b> No — wilt is soil-borne. Do soil drench +
          <i> Trichoderma</i>.
        </li>
        <li>
          <b>More sprays = more protection?</b> ❌ Over-spraying harms crops &amp; microbes; causes
          resistance. Follow dose/interval.
        </li>
      </ol>

      <h3>💧 Irrigation &amp; Water Management</h3>
      <ol start={21}>
        <li>
          <b>Daily water under drip?</b> Veg 2–4 L/plant/day; fruit trees 10–15 L (depends on crop,
          age, season).
        </li>
        <li>
          <b>Best time to irrigate?</b> Early morning/evening to reduce evaporation.
        </li>
        <li>
          <b>Plants wilt even after irrigation?</b> Root rot, nematodes, or salts. Check roots/soil.
        </li>
        <li>
          <b>“Roses shouldn’t get water-soluble fertilizers”?</b> ❌ Myth. Roses need balanced NPK +
          micros; WSF improves flowering.
        </li>
        <li>
          <b>Is calcium nitrate unsafe in winter?</b> ❌ Safe year-round; improves fruit quality in
          cold stress.
        </li>
      </ol>

      <h3>🧪 Soil Health &amp; Fertility</h3>
      <ol start={26}>
        <li>
          <b>How often to test soil?</b> Every 2 years.
        </li>
        <li>
          <b>Low organic carbon?</b> Add compost, FYM, residues, bio-stimulants.
        </li>
        <li>
          <b>Use manure with chemical fertilizers?</b> ✅ Yes — INM is best.
        </li>
        <li>
          <b>Why gypsum?</b> Reclaims sodic/alkaline soils; improves infiltration; lowers sodium.
        </li>
        <li>
          <b>Fertilizers not working?</b> Fix pH/salinity/compaction first (lime, gypsum, organics).
        </li>
      </ol>

      <h3>🌤️ Weather &amp; Crop Stress</h3>
      <ol start={31}>
        <li>
          <b>Field flooded by heavy rain?</b> Drain quickly; fungicide drench; foliar nutrients.
        </li>
        <li>
          <b>Protect from summer heat?</b> Mulching, shade nets, seaweed/amino sprays.
        </li>
        <li>
          <b>Pre-monsoon prep?</b> Drainage channels, bunds, basal fertilizers, preventive fungicides.
        </li>
      </ol>

      <h3>❌ Myths &amp; Wrong Practices</h3>
      <ol start={34}>
        <li>
          <b>Egg/oil/kitchen extracts for pests?</b> ❌ Not recommended; can burn leaves. Prefer
          neem-based or approved bio-products.
        </li>
        <li>
          <b>“Shower” plants with pesticides?</b> ❌ Use fine mist to cover leaves; avoid drenching.
        </li>
        <li>
          <b>More chemicals = better protection?</b> ❌ Correct dose/timing matters more.
        </li>
        <li>
          <b>Regular sprays even if healthy?</b> ❌ Spray only when needed; preventive antifungals
          only in risky weather.
        </li>
        <li>
          <b>Costly fertilizers always give more yield?</b> ❌ Balanced nutrition beats fancy labels.
        </li>
        <li>
          <b>More bio-stimulants = more yield?</b> ❌ Weekly small doses are enough.
        </li>
        <li>
          <b>Imported = better?</b> ❌ Not always; use locally tested, crop-specific products.
        </li>
      </ol>

      <h3>🌾 Crop-Specific FAQs</h3>
      <ol start={41}>
        <li>
          <b>Tomato yellowing + wilting?</b> Fusarium or root-knot nematodes. Soil treatment +
          resistant varieties.
        </li>
        <li>
          <b>Tomato mosaic, curling, stunting?</b> Likely TLCV. Rogue plants + control whiteflies.
        </li>
        <li>
          <b>Chilli ring spots &amp; necrosis?</b> Tospovirus via thrips. Rogue + control thrips.
        </li>
        <li>
          <b>Cotton dropping squares/flowers?</b> Stress or pink bollworm. Scout larvae; spray
          suitable insecticides.
        </li>
        <li>
          <b>Banana yellow streaks + stunting?</b> Bunchy top/mosaic virus. Use virus-free suckers;
          rogue infected plants.
        </li>
        <li>
          <b>Paddy leaves bronze/reddish?</b> K deficiency or BPH pest. Diagnose before action.
        </li>
        <li>
          <b>Brinjal blackened fruit inside?</b> Fruit borer. Remove infested fruits + pheromone
          traps.
        </li>
        <li>
          <b>Roses not flowering?</b> Low sunlight, wrong pruning, or micronutrient lack. Fix light,
          prune, apply balanced NPK + micros.
        </li>
        <li>
          <b>Cucumber/gourds dropping flowers?</b> Male flowers naturally drop; female drop = stress
          or boron deficiency.
        </li>
        <li>
          <b>Pests persist after sprays?</b> Wrong dose/timing, resistance, or fake product. Rotate
          chemistries; spray evenings.
        </li>
      </ol>
    </>
  );
}


/* Register in your chapter map */
const chapterMap = {
  "1-insecticides": Chapter1,
  "2-fungicides": Chapter2,
  "3-biofertilizers": Chapter3,
  "4-tank-mixing": Chapter4,
  "5-nutrition": Chapter5,
  "6-biostimulants": Chapter6,
  "7-soil-carbon": Chapter7, 
  "8-bio-inputs": Chapter8,
  "9-mulching": Chapter9,
  "10-ipm": Chapter10,
  "11-weeds": Chapter11,
  "12-irrigation": Chapter12,
  "13-soil-health": Chapter13,
  "14-soil-test": Chapter14,
  "15-faq": Chapter15,


};


/* ====================== PAGE COMPONENT ====================== */
export default function GuideChapter() {
  return (
    <>
      <Seo pageKey="guide" title={`${chapterTitleFor(slug)} — AV Traders`} />
      <GuideChapterInner />
    </>
  );
}

function GuideChapterInner() {
  const { slug } = useParams();
  const idx = order.indexOf(slug);
  const prev = idx > 0 ? `/guide/chapter/${order[idx - 1]}` : null;
  const next = idx < order.length - 1 ? `/guide/chapter/${order[idx + 1]}` : null;

  const niceTitle = (s) =>
    (s || "").split("-").slice(1).join(" ").replace(/\b\w/g, (m) => m.toUpperCase());

  // pick the chapter component if available
  const ChapterComp = chapterMap[slug];

  return (
    <div className="guide-chapter">
      <header className="chapter-head">
        <h1>{`Chapter ${idx >= 0 ? idx + 1 : "–"}`}</h1>
        <p className="muted">{niceTitle(slug)}</p>
      </header>

      <article className="chapter-body">
        {ChapterComp ? (
          <ChapterComp />
        ) : (
          <p>Content will be added soon.</p>
        )}
      </article>

{/* --- Sliding pager (1=Index, 2=Chap1, ... , 16=Last) --- */}
<nav className="pager-shelf">
  {(() => {
    const totalPages = order.length + 1; // 15 chapters + index = 16
    const currentPage = idx >= 0 ? idx + 2 : 1; // chap1->2, chap2->3, ...; index->1

    const pageToHref = (p) =>
      p === 1 ? "/guide" : `/guide/chapter/${order[p - 2]}`;

    const renderBtn = (p, extra = "") => (
      <Link
        key={p}
        to={pageToHref(p)}
        className={`page-btn ${extra} ${p === currentPage ? "active" : ""}`}
        onClick={() => window.scrollTo(0, 0)}   // 🔥 scroll to top
      >
        {p}
      </Link>
    );

    // --- window of 3 numbers, centered on current when possible ---
    const WIN = 3;
    let start = Math.max(1, currentPage - Math.floor(WIN / 2));
    let end = start + WIN - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - WIN + 1);
    }

    const pages = [];
    for (let p = start; p <= end; p++) pages.push(p);

    const showLast = pages[pages.length - 1] !== totalPages;

    const hasNext = currentPage < totalPages;
    const nextHref = hasNext ? pageToHref(currentPage + 1) : null;

    return (
      <>
        {hasNext && (
          <Link
            to={nextHref}
            className="next-cta"
            onClick={() => window.scrollTo(0, 0)}   // 🔥 scroll to top
          >
            Next page →
          </Link>
        )}

        <div className="page-nums">
          {pages.map((p) => renderBtn(p))}
          {showLast && (
            <>
              <span className="dots">…</span>
              {renderBtn(totalPages, "last")}
            </>
          )}
        </div>
      </>
    );
  })()}
</nav>

    </div>
  );
}

function chapterTitleFor(slug) {
  if (!slug) return 'Guide';
  const t = (typeof CHAPTERS !== 'undefined' && CHAPTERS) || null;
  // Best effort: pull the human title from the local chapters list.
  if (Array.isArray(t)) {
    const found = t.find((c) => c.slug === slug);
    if (found?.title) return found.title;
  }
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

<style>
{`
  /* Make the built-in chapter subtitle red & a bit larger across all chapters */
  .chapter-header .sub,
  .chapter-card .sub,
  .chapter-hero .sub {
    color: #d32f2f !important;   /* red */
    font-size: 1.25rem;          /* a bit bigger */
    font-weight: 600;            /* semi-bold */
    margin-top: .25rem;
  }
`}
</style>
