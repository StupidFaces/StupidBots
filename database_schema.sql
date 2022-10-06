CREATE TABLE public.collection (
    uid serial NOT NULL,
    name varchar NOT NULL,
    address varchar NOT NULL,
    PRIMARY KEY(uid)
);


CREATE TABLE public.hodler (
    uid serial NOT NULL,
    discord_id varchar NOT NULL,
    discord_name varchar NOT NULL,
    public_key varchar NOT NULL,
    created_at timestamp NULL DEFAULT now(),
    CONSTRAINT hodler_discord_id_key UNIQUE (discord_id),
    CONSTRAINT hodler_public_key_key UNIQUE (public_key),
    PRIMARY KEY(uid)
);


CREATE TABLE public.asset (
    uid serial NOT NULL,
    asset_id int NOT NULL,
    hodler_id int NOT NULL,
    collection_id int NOT NULL,
    custom_name varchar,
    CONSTRAINT hodler_asset_id_key UNIQUE (asset_id),
    CONSTRAINT fk_hodler FOREIGN KEY(hodler_id) REFERENCES hodler(uid),
    CONSTRAINT fk_collection FOREIGN KEY(collection_id) REFERENCES collection(uid),
    PRIMARY KEY(uid)
);

CREATE TABLE public.face_of_the_month (
    uid serial NOT NULL,
    asset_id int NOT NULL,
    month_year varchar,
    hodler_public_key varchar,
    reward_amount int NOT NULL,
    reward_asset_id int NOT NULL,
    created_at timestamp NULL DEFAULT now(),
    PRIMARY KEY(uid)
);