
// src/types/Clause.ts
export interface Clause {
    /** Serial number for ordering */
    number: number;

    /** Title of the clause, e.g. "Cancellation Policy" */
    title: string;

    /** Optional style hint for UI (e.g., 'number', 'disc', 'none') */
    style?: 'number' | 'disc' | 'none' | string;

    /**
     * Points can be:
     *  - a simple string,
     *  - or a nested object with its own heading and an array of sub-points.
     */
    points: Array<
        | string
        | {
            heading: string;
            style?: 'number' | 'disc' | 'none' | string;
            points: string[];
        }
    >;
}


export const combinedTermsAndPolicies: Clause[] = [
    // ===== Terms & Conditions =====
    {
        number: 1,
        title: 'Booking & Slot Management',
        style: 'number',
        points: [
            'Members may reserve slots up to 14 days in advance through the platform.',
            'Bookings close 1 hour before the session start time to allow gyms to prepare.',
            'A booking is automatically marked as a no-show if the member arrives more than 10 minutes late.',
            'Two consecutive no-shows within 30 days may lead to temporary suspension of booking privileges.',
        ],
    },
    {
        number: 2,
        title: 'Payment & Pricing',
        style: 'number',
        points: [
            'All prices displayed include applicable taxes; no hidden charges.',
            'Gyms may adjust rates, but changes apply only to future bookings and never to confirmed slots.',
            'All transactions occur in INR unless stated otherwise.',
        ],
    },
    {
        number: 3,
        title: 'Membership & Packages',
        style: 'number',
        points: [
            'Memberships and credits are non-transferable unless explicitly stated in promotional campaigns.',
            'Unused credits expire at the end of the validity period and are not redeemable for cash.',
        ],
    },
    {
        number: 4,
        title: 'Health & Safety',
        style: 'number',
        points: [
            'Users are responsible for ensuring they are medically fit to participate.',
            'Gyms may refuse entry to anyone under the influence of alcohol, drugs, or displaying disruptive behavior—no refund applicable.',
        ],
    },
    {
        number: 5,
        title: 'Privacy & Data Protection',
        style: 'number',
        points: [
            'Personal data is collected only for booking, payment processing, and service improvement.',
            'Data is never sold; it may be shared only with the booked gym for operational purposes.',
        ],
    },
    {
        number: 6,
        title: 'Dispute Resolution',
        style: 'number',
        points: [
            'Users must first contact platform support within 7 days of an incident.',
            'If unresolved, disputes are subject to the jurisdiction of New Delhi courts under Indian law.',
        ],
    },
    {
        number: 7,
        title: 'Force Majeure',
        style: 'number',
        points: [
            'Neither the platform nor the gym is liable for cancellations caused by events beyond reasonable control such as natural disasters, government restrictions, or pandemics.',
            'Users will receive booking credits when feasible for such cancellations.',
        ],
    },

    // ===== Policies =====
    {
        number: 8,
        title: 'Cancellation Policy',
        style: 'number',
        points: [
            'Free cancellation is allowed up to 4 hours before the scheduled session.',
            'Cancellations made within 4 hours of the session start time will incur a 100% charge or result in the loss of one booking credit.',
            'In case of a gym-initiated cancellation, users receive a full refund or equivalent credits automatically.',
            'Repeated last-minute cancellations may lead to temporary suspension of booking privileges.',
        ],
    },
    {
        number: 9,
        title: 'Refund Policy',
        style: 'number',
        points: [
            'Refunds for eligible cancellations are processed to the original payment method within 5–7 business days.',
            'Platform convenience fees and payment gateway charges are non-refundable unless the cancellation is due to a platform or gym error.',
            'Subscription or package refunds are issued on a pro-rata basis only if more than 50% of the validity period remains and no policy violations occurred.',
            'Promotional credits or discounts are not redeemable as cash refunds.',
        ],
    },
    {
        number: 10,
        title: 'Reschedule Policy',
        style: 'number',
        points: [
            'Users may reschedule up to 4 hours before the session start without any fee.',
            'Rescheduling within 4 hours is treated as a late cancellation and follows the cancellation policy.',
        ],
    },
    {
        number: 11,
        title: 'Payment Policy',
        style: 'number',
        points: [
            'All transactions are processed in INR and include applicable taxes.',
            'Payment must be completed at the time of booking to confirm a slot.',
            'Any failed transactions automatically trigger a reversal within 48 hours.',
        ],
    },
    {
        number: 12,
        title: 'User Conduct Policy',
        style: 'number',
        points: [
            'Users must maintain appropriate behavior and follow gym-specific rules during visits.',
            'Entry may be denied to anyone under the influence of alcohol or drugs without any refund.',
            'Abuse of staff or other members will lead to permanent account suspension.',
        ],
    },
    {
        number: 13,
        title: 'Health & Safety Policy',
        style: 'number',
        points: [
            'Members are responsible for ensuring they are medically fit to participate in any activity.',
            'Gyms may refuse participation if a user exhibits symptoms of contagious illness or injury risk.',
            'Emergency procedures and first-aid support are available at all partner gyms.',
        ],
    },
    {
        number: 14,
        title: 'Force Majeure Policy',
        style: 'number',
        points: [
            'The platform and partner gyms are not liable for cancellations caused by natural disasters, government restrictions, or other events beyond control.',
            'Whenever feasible, affected bookings will be compensated with equivalent credits for future use.',
        ],
    },
    {
        number: 15,
        title: 'Dispute Resolution Policy',
        style: 'number',
        points: [
            'Users must report any disputes or grievances to support within 7 days of the incident.',
            'Unresolved disputes will be governed by the laws of India and fall under the jurisdiction of Uttar Pradesh courts.',
        ],
    },
    {
        number: 15,
        title: 'Head Office',
        style: 'disk',
        points: [
            '181-K, Ramana, Jalhupur',
            'Varanasi, Uttar Pradesh, 221104',
        ],
    },
    {
        number: 16,
        title: 'Branch Office',
        style: 'disk',
        points: [
            '144-B, Sai Sagar Nagar, Rau',
            'Indore, Madhya Pradesh, 453331',
        ],
    },
    {
        number: 17,
        title: 'Contact Details',
        style: 'disk',
        points: [
            'Phone: +91 9359458887',
            'Email: sm29@sft@gmail.com',
        ],
    },
];
